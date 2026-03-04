#!/usr/bin/env bun
/**
 * Тестовый скрипт для проверки webhook
 * Имитирует запрос от Telegram
 */

const WEBHOOK_URL = 'https://my-tg-mini-app-seven.vercel.app/api/webhook';

// Тестовое сообщение от Telegram (команда /start)
const testUpdate = {
  update_id: 123456789,
  message: {
    message_id: 1,
    from: {
      id: 123456789,
      is_bot: false,
      first_name: 'Test',
      username: 'test_user',
      language_code: 'en',
    },
    chat: {
      id: 123456789,
      first_name: 'Test',
      username: 'test_user',
      type: 'private',
    },
    date: 1733875200,
    text: '/start',
  },
};

console.log('=== Тест Webhook ===');
console.log('URL:', WEBHOOK_URL);
console.log('Update:', JSON.stringify(testUpdate, null, 2));
console.log('\nОтправка запроса...');

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testUpdate),
  });

  const result = await response.json();
  const status = response.status;

  console.log('\n=== Ответ ===');
  console.log('Status:', status);
  console.log('Body:', JSON.stringify(result, null, 2));

  if (status === 200) {
    console.log('\n✅ Webhook работает! Бот должен ответить на /start');
  } else {
    console.log('\n❌ Ошибка! Статус:', status);
  }
} catch (error) {
  console.error('\n❌ Ошибка запроса:', error);
  process.exit(1);
}
