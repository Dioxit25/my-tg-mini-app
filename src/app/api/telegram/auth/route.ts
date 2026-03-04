import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  validateInitData,
  getUserFromInitData,
  getChatInstanceFromInitData,
  isInitDataExpired,
  type TelegramUser
} from '@/lib/telegram';

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN не задан в переменных окружения');
}

/**
 * POST /api/telegram/auth
 * Проверяет и сохраняет данные пользователя из Telegram
 * Теперь работает с PostgreSQL через Prisma
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] Начало обработки запроса (PostgreSQL)');

    const body = await request.json();
    const { initData } = body;

    console.log('[API] Получен запрос с initData:', initData ? 'да' : 'нет');

    // Проверяем наличие initData
    if (!initData) {
      console.error('[API] Ошибка: initData отсутствует');
      return NextResponse.json(
        { error: 'initData обязателен' },
        { status: 400 }
      );
    }

    // Проверяем наличие токена бота
    if (!BOT_TOKEN) {
      console.error('[API] Ошибка: TELEGRAM_BOT_TOKEN не задан');
      return NextResponse.json(
        { error: 'Сервер не настроен. Обратитесь к администратору.' },
        { status: 500 }
      );
    }

    console.log('[API] Валидация initData...');

    // Валидируем initData
    if (!validateInitData(initData, BOT_TOKEN)) {
      console.error('[API] Ошибка: невалидный initData');
      return NextResponse.json(
        { error: 'Невалидные данные Telegram. Пожалуйста, откройте приложение из Telegram.' },
        { status: 401 }
      );
    }

    console.log('[API] initData валиден');

    // Проверяем срок действия initData
    if (isInitDataExpired(initData)) {
      console.error('[API] Ошибка: initData истек');
      return NextResponse.json(
        { error: 'Срок действия данных истек. Пожалуйста, откройте приложение заново.' },
        { status: 401 }
      );
    }

    // Извлекаем данные пользователя
    const telegramUser = getUserFromInitData(initData);
    if (!telegramUser) {
      console.error('[API] Ошибка: не удалось получить пользователя из initData');
      return NextResponse.json(
        { error: 'Не удалось получить данные пользователя' },
        { status: 400 }
      );
    }

    console.log('[API] Пользователь получен:', telegramUser.first_name, telegramUser.username);

    // Извлекаем chat_instance (идентификатор группы)
    const chatInstance = getChatInstanceFromInitData(initData);
    console.log('[API] Chat instance:', chatInstance || 'нет');

    // Находим или создаем пользователя в базе данных
    console.log('[API] Поиск пользователя в базе данных...');
    let user = await db.telegramUser.findUnique({
      where: { telegramId: telegramUser.id },
      include: { groups: { include: { group: true } } }
    });

    if (!user) {
      console.log('[API] Создание нового пользователя...');
      user = await db.telegramUser.create({
        data: {
          telegramId: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          languageCode: telegramUser.language_code,
          photoUrl: telegramUser.photo_url,
          isPremium: telegramUser.is_premium || false,
        },
        include: { groups: { include: { group: true } } }
      });
    } else {
      console.log('[API] Обновление существующего пользователя...');
      // Обновляем данные пользователя если изменились
      user = await db.telegramUser.update({
        where: { id: user.id },
        data: {
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          isPremium: telegramUser.is_premium || false,
        },
        include: { groups: { include: { group: true } } }
      });
    }

    // Если есть chat_instance, создаем или обновляем группу
    let groupData = null;
    if (chatInstance) {
      console.log('[API] Обработка группы...');
      try {
        // Парсим chat_instance как BigInt для ID группы
        // Проверяем, что chat_instance - это валидное число
        const chatInstanceNum = parseInt(chatInstance, 10);
        if (isNaN(chatInstanceNum)) {
          console.error('[API] Ошибка: chat_instance не является валидным числом:', chatInstance);
          throw new Error('Invalid chat_instance format');
        }
        const groupId = BigInt(chatInstanceNum);

        let group = await db.telegramGroup.findUnique({
          where: { telegramId: groupId }
        });

        if (!group) {
          console.log('[API] Создание новой группы...');
          group = await db.telegramGroup.create({
            data: {
              telegramId: groupId,
              type: 'supergroup', // По умолчанию
            }
          });
        }

        // Создаем связь пользователя с группой, если её нет
        const existingRelation = await db.userGroup.findUnique({
          where: {
            userId_groupId: {
              userId: user.id,
              groupId: group.id,
            }
          }
        });

        if (!existingRelation) {
          console.log('[API] Создание связи пользователя с группой...');
          await db.userGroup.create({
            data: {
              userId: user.id,
              groupId: group.id,
              role: 'member',
            }
          });

          // Перезагружаем пользователя с группами
          user = await db.telegramUser.findUnique({
            where: { id: user.id },
            include: { groups: { include: { group: true } } }
          }) as typeof user;
        }

        groupData = group;
      } catch (groupError) {
        console.error('[API] Ошибка при обработке группы:', groupError);
        // Не прерываем выполнение, просто логируем ошибку
      }
    }

    // Создаем сессию пользователя
    console.log('[API] Создание сессии...');
    const session = await db.userSession.create({
      data: {
        userId: user.id,
        initData: initData.substring(0, 1000), // Сохраняем только начало
        chatInstance: chatInstance || null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
      }
    });

    console.log('[API] Формируем ответ...');

    // Возвращаем данные пользователя
    const response = {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        languageCode: user.languageCode,
        photoUrl: user.photoUrl,
        isPremium: user.isPremium,
      },
      groups: user.groups.map(ug => ({
        id: ug.group.id,
        telegramId: ug.group.telegramId.toString(),
        title: ug.group.title,
        type: ug.group.type,
        username: ug.group.username,
        role: ug.role,
        joinedAt: ug.joinedAt,
      })),
      currentGroup: groupData ? {
        id: groupData.id,
        telegramId: groupData.telegramId.toString(),
        title: groupData.title,
        type: groupData.type,
        username: groupData.username,
      } : null,
      sessionId: session.id,
    };

    console.log('[API] Ответ сформирован успешно');

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Ошибка при аутентификации Telegram:', error);
    console.error('[API] Детали ошибки:', JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}
