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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    // Проверяем наличие initData
    if (!initData) {
      return NextResponse.json(
        { error: 'initData обязателен' },
        { status: 400 }
      );
    }

    // Проверяем наличие токена бота
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Сервер не настроен. Обратитесь к администратору.' },
        { status: 500 }
      );
    }

    // Валидируем initData
    if (!validateInitData(initData, BOT_TOKEN)) {
      return NextResponse.json(
        { error: 'Невалидные данные Telegram. Пожалуйста, откройте приложение из Telegram.' },
        { status: 401 }
      );
    }

    // Проверяем срок действия initData
    if (isInitDataExpired(initData)) {
      return NextResponse.json(
        { error: 'Срок действия данных истек. Пожалуйста, откройте приложение заново.' },
        { status: 401 }
      );
    }

    // Извлекаем данные пользователя
    const telegramUser = getUserFromInitData(initData);
    if (!telegramUser) {
      return NextResponse.json(
        { error: 'Не удалось получить данные пользователя' },
        { status: 400 }
      );
    }

    // Извлекаем chat_instance (идентификатор группы)
    const chatInstance = getChatInstanceFromInitData(initData);

    // Находим или создаем пользователя в базе данных
    let user = await db.telegramUser.findUnique({
      where: { telegramId: telegramUser.id },
      include: { groups: { include: { group: true } } }
    });

    if (!user) {
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
      // Парсим chat_instance как BigInt для ID группы
      const groupId = BigInt(chatInstance);

      let group = await db.telegramGroup.findUnique({
        where: { telegramId: groupId }
      });

      if (!group) {
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
    }

    // Создаем сессию пользователя
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

    // Возвращаем данные пользователя
    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Ошибка при аутентификации Telegram:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
