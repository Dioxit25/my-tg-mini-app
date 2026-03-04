import { NextRequest, NextResponse } from 'next/server';

// Токен бота
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(request: NextRequest) {
  try {
    console.log('[SET-WEBHOOK] Начало установки webhook');

    if (!BOT_TOKEN) {
      console.error('[SET-WEBHOOK] TELEGRAM_BOT_TOKEN не задан');
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN не задан' },
        { status: 500 }
      );
    }

    // Определяем правильный URL webhook на основе заголовка Host
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/webhook`;

    console.log('[SET-WEBHOOK] Установка webhook на:', webhookUrl);

    // Используем Telegram API напрямую
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        drop_pending_updates: true, // Сбрасываем pending updates
      })
    });

    const data = await response.json();

    console.log('[SET-WEBHOOK] Ответ Telegram API:', JSON.stringify(data));

    if (data.ok) {
      console.log('[SET-WEBHOOK] Webhook успешно установлен');
      return NextResponse.json({
        success: true,
        webhookUrl,
        telegramResponse: data,
        message: 'Webhook успешно установлен!'
      });
    } else {
      console.error('[SET-WEBHOOK] Ошибка установки webhook:', data);
      return NextResponse.json(
        {
          error: 'Ошибка установки webhook',
          details: data.description || 'Неизвестная ошибка',
          telegramResponse: data,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[SET-WEBHOOK] Ошибка:', error);
    return NextResponse.json(
      {
        error: 'Ошибка установки webhook',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}
