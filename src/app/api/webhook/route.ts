import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import { autoRetry } from '@grammyjs/auto-retry';

// Токен бота
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('[WEBHOOK] TELEGRAM_BOT_TOKEN не задан');
}

// URL вашего Mini App
const WEB_APP_URL = 'https://my-tg-mini-app-seven.vercel.app';

/**
 * POST /api/webhook
 * Telegram Webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      console.error('[WEBHOOK] TELEGRAM_BOT_TOKEN не задан');
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN не задан' },
        { status: 500 }
      );
    }

    // Создаем бота для каждого запроса (для serverless)
    const bot = new Bot(BOT_TOKEN);
    bot.api.config.use(autoRetry());

    // Обработка команды /start
    bot.command('start', async (ctx) => {
      const chatType = ctx.chat?.type;
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;

      console.log('[BOT] Команда /start от пользователя', userId, 'в чате', chatType, chatId);

      let message = '👋 Привет! Я бот для Mini App с идентификацией пользователя и группы.\n\nНажмите кнопку ниже, чтобы открыть приложение:';

      // Отправляем сообщение с кнопкой Mini App
      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Открыть Mini App',
                web_app: { url: WEB_APP_URL },
              }
            ]
          ]
        }
      });

      console.log('[BOT] Отправлена кнопка Mini App');
    });

    // Обработка других сообщений в личных чатах
    bot.on('message', async (ctx) => {
      const chatType = ctx.chat?.type;

      if (chatType === 'private') {
        await ctx.reply('👋 Нажмите кнопку ниже, чтобы открыть Mini App:', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Открыть Mini App',
                  web_app: { url: WEB_APP_URL },
                }
              ]
          ]
        });
      }
    });

    console.log('[WEBHOOK] Получен запрос от Telegram');
    const body = await request.json();
    console.log('[WEBHOOK] Тип обновления:', body.update_id ? body.message?.chat?.type : 'unknown');
    console.log('[WEBHOOK] Есть сообщение?', !!body.message);
    console.log('[WEBHOOK] Есть команда?', body.message?.text);

    // Обрабатываем обновление от Telegram
    await bot.handleUpdate(body);

    console.log('[WEBHOOK] Обновление обработано успешно');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[WEBHOOK] Ошибка:', error);
    console.error('[WEBHOOK] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Ошибка обработки webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook
 * Для установки webhook
 */
export async function GET(request: NextRequest) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const url = new URL(request.url);
  const webhookUrl = `${url.origin}/api/webhook`;

  try {
    console.log('[WEBHOOK] Установка webhook на:', webhookUrl);

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN не задан' },
        { status: 500 }
      );
    }

    // Создаем бота для установки webhook
    const bot = new Bot(BOT_TOKEN);
    bot.api.config.use(autoRetry());

    // Устанавливаем webhook
    await bot.api.setWebhook(webhookUrl);

    console.log('[WEBHOOK] Webhook успешно установлен');

    return NextResponse.json({
      success: true,
      webhookUrl,
      message: 'Webhook успешно установлен. Теперь бот будет отвечать на команды!'
    });
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

