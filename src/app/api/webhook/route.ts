import { NextRequest, NextResponse } from 'next/server';

// Токен бота
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// URL вашего Mini App
const WEB_APP_URL = 'https://my-tg-mini-app-seven.vercel.app';

/**
 * POST /api/webhook
 * Telegram Webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[WEBHOOK] POST запрос получен');

    if (!BOT_TOKEN) {
      console.error('[WEBHOOK] TELEGRAM_BOT_TOKEN не задан');
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN не задан' },
        { status: 500 }
      );
    }

    console.log('[WEBHOOK] TELEGRAM_BOT_TOKEN задан');

    // Читаем тело запроса
    const body = await request.json();
    console.log('[WEBHOOK] Тело запроса:', JSON.stringify(body).substring(0, 200));

    // Проверяем, есть ли сообщение
    if (body.message) {
      const message = body.message;
      const text = message.text;
      const chat = message.chat;
      const from = message.from;

      console.log('[WEBHOOK] Сообщение:', text, 'от', from?.first_name, 'в чате', chat?.type);

      // Если это команда /start
      if (text === '/start') {
        console.log('[WEBHOOK] Обработка команды /start');

        const replyText = '👋 Привет! Я бот для Mini App с идентификацией пользователя и группы.\n\nНажмите кнопку ниже, чтобы открыть приложение:';

        // Отправляем ответ через Telegram API
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat.id,
            text: replyText,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 Открыть Mini App',
                    web_app: { url: WEB_APP_URL }
                  }
                ]
              ]
            }
          })
        });

        const responseData = await response.json();
        console.log('[WEBHOOK] Ответ sendMessage:', JSON.stringify(responseData));

        if (!responseData.ok) {
          console.error('[WEBHOOK] Ошибка отправки сообщения:', responseData);
        }
      } else if (chat?.type === 'private') {
        console.log('[WEBHOOK] Сообщение в личном чате, отправляем кнопку');

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat.id,
            text: '👋 Нажмите кнопку ниже, чтобы открыть Mini App:',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 Открыть Mini App',
                    web_app: { url: WEB_APP_URL }
                  }
                ]
              ]
            }
          })
        });

        const responseData = await response.json();
        console.log('[WEBHOOK] Ответ sendMessage:', JSON.stringify(responseData));
      }
    }

    console.log('[WEBHOOK] Возвращаем ok: true');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[WEBHOOK] Ошибка:', error);
    console.error('[WEBHOOK] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Ошибка обработки webhook', details: error instanceof Error ? error.message : 'Неизвестная ошибка' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook
 * Для установки webhook
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const webhookUrl = `${url.origin}/api/webhook`;

  try {
    console.log('[WEBHOOK] GET запрос - установка webhook на:', webhookUrl);

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN не задан' },
        { status: 500 }
      );
    }

    // Используем Telegram API напрямую
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });

    const data = await response.json();

    console.log('[WEBHOOK] Ответ Telegram API:', JSON.stringify(data));

    if (data.ok) {
      console.log('[WEBHOOK] Webhook успешно установлен');
      return NextResponse.json({
        success: true,
        webhookUrl,
        message: 'Webhook успешно установлен!'
      });
    } else {
      console.error('[WEBHOOK] Ошибка установки webhook:', data);
      return NextResponse.json(
        {
          error: 'Ошибка установки webhook',
          details: data.description || 'Неизвестная ошибка'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[WEBHOOK] Ошибка установки webhook:', error);
    return NextResponse.json(
      {
        error: 'Ошибка установки webhook',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}
