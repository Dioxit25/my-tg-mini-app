import { Bot, webhookCallback } from 'grammy';
import { autoRetry } from '@grammyjs/auto-retry';

// Токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN не задан в переменных окружения');
  process.exit(1);
}

// Создаем бота
const bot = new Bot(BOT_TOKEN);

// Добавляем автоматический retry при ошибках
bot.api.config.use(autoRetry());

// Обработка команды /start
bot.command('start', async (ctx) => {
  const chatType = ctx.chat?.type;
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  console.log('[BOT] Команда /start от пользователя', userId, 'в чате', chatId, chatId);

  // Имя вашего Mini App (короткое имя из BotFather)
  const miniAppName = 'freetimev2'; // ЗАМЕНИТЕ НА ВАШЕ КОРОТКОЕ ИМЯ!

  // Формируем URL Mini App
  const webAppUrl = `https://my-tg-mini-app-seven.vercel.app`;

  let message = '';

  if (chatType === 'private') {
    // Личный чат
    message = '👋 Привет! Я бот для Mini App.\n\nНажмите кнопку ниже, чтобы открыть приложение:';
  } else if (chatType === 'group' || chatType === 'supergroup') {
    // Групповой чат
    message = '👋 Привет! Я бот для Mini App.\n\nНажмите кнопку ниже, чтобы открыть приложение:';
  } else {
    message = '👋 Привет! Нажмите кнопку ниже, чтобы открыть приложение:';
  }

  // Отправляем сообщение с кнопкой Mini App
  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть Mini App',
            url: webAppUrl,
          }
        ]
      ]
    }
  });

  console.log('[BOT] Отправлена кнопка Mini App');
});

// Обработка других сообщений
bot.on('message', async (ctx) => {
  const chatType = ctx.chat?.type;

  // Только в личных чатах
  if (chatType === 'private') {
    const miniAppName = 'freetimev2'; // ЗАМЕНИТЕ НА ВАШЕ КОРОТКОЕ ИМЯ!
    const webAppUrl = `https://my-tg-mini-app-seven.vercel.app`;

    await ctx.reply('👋 Нажмите кнопку ниже, чтобы открыть Mini App:', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Открыть Mini App',
              url: webAppUrl,
            }
          ]
        ]
      }
    });
  }
});

// Запуск бота (для локального тестирования)
if (require.main === module) {
  bot.start()
    .then(() => {
      console.log('[BOT] Бот запущен!');
    })
    .catch((err) => {
      console.error('[BOT] Ошибка запуска:', err);
      process.exit(1);
    });
}

export default webhookCallback(bot, 'http');
