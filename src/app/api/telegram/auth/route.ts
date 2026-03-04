import { NextRequest, NextResponse } from 'next/server';
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
 * Проверяет и возвращает данные пользователя из Telegram
 * ВРЕМЕННАЯ ВЕРСИЯ: без сохранения в базу данных (для Vercel)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] Начало обработки запроса');

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

    // ВРЕМЕННО: Не используем базу данных, просто возвращаем данные из Telegram
    // Это нужно, чтобы приложение работало на Vercel (SQLite не поддерживается)

    // Формируем текущую группу из chat_instance если есть
    let currentGroup = null;
    if (chatInstance) {
      currentGroup = {
        id: 'temp-group-id',
        telegramId: chatInstance,
        title: 'Группа (текущая)',
        type: 'supergroup',
        username: null,
      };
    }

    console.log('[API] Формируем ответ...');

    // Возвращаем данные пользователя напрямую из Telegram
    const response = {
      success: true,
      user: {
        id: 'temp-user-id',
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        languageCode: telegramUser.language_code,
        photoUrl: telegramUser.photo_url,
        isPremium: telegramUser.is_premium || false,
      },
      groups: currentGroup ? [currentGroup] : [],
      currentGroup: currentGroup,
      sessionId: 'temp-session-id',
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
