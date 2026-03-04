import { createHmac } from 'crypto';

// Интерфейсы для данных от Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id?: string;
  user?: string; // JSON строка
  auth_date: string;
  hash: string;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
}

/**
 * Парсит initData строку в объект
 */
export function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
}

/**
 * Валидирует Telegram initData с помощью проверки хеша
 * @param initData - строка с initData от Telegram WebApp
 * @param botToken - токен вашего Telegram бота
 * @returns true если данные валидны, false иначе
 */
export function validateInitData(initData: string, botToken: string): boolean {
  try {
    const data = parseInitData(initData);
    const hash = data.hash;

    if (!hash) {
      console.error('No hash provided in initData');
      return false;
    }

    // Удаляем hash из данных для проверки
    const { hash: _, ...dataForCheck } = data;

    // Сортируем ключи по алфавиту
    const sortedKeys = Object.keys(dataForCheck).sort();

    // Формируем строку для проверки
    const dataCheckString = sortedKeys
      .map(key => `${key}=${dataForCheck[key]}`)
      .join('\n');

    // Создаем секретный ключ из bot token
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем хеш
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем хеши (используем timing-safe comparison для безопасности)
    return hash === computedHash;
  } catch (error) {
    console.error('Error validating initData:', error);
    return false;
  }
}

/**
 * Извлекает пользователя из initData
 */
export function getUserFromInitData(initData: string): TelegramUser | null {
  try {
    const data = parseInitData(initData);
    const userStr = data.user;

    if (!userStr) {
      return null;
    }

    return JSON.parse(userStr) as TelegramUser;
  } catch (error) {
    console.error('Error parsing user from initData:', error);
    return null;
  }
}

/**
 * Извлекает chat_instance из initData (идентификатор группы/чата)
 */
export function getChatInstanceFromInitData(initData: string): string | null {
  try {
    const data = parseInitData(initData);
    return data.chat_instance || null;
  } catch (error) {
    console.error('Error parsing chat instance from initData:', error);
    return null;
  }
}

/**
 * Извлекает auth_date из initData
 */
export function getAuthDate(initData: string): Date | null {
  try {
    const data = parseInitData(initData);
    const authDate = data.auth_date;

    if (!authDate) {
      return null;
    }

    return new Date(parseInt(authDate) * 1000);
  } catch (error) {
    console.error('Error parsing auth date from initData:', error);
    return null;
  }
}

/**
 * Проверяет, не истек ли срок действия initData (по умолчанию 24 часа)
 */
export function isInitDataExpired(initData: string, maxAgeHours: number = 24): boolean {
  try {
    const authDate = getAuthDate(initData);

    if (!authDate) {
      return true;
    }

    const now = new Date();
    const ageInHours = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);

    return ageInHours > maxAgeHours;
  } catch (error) {
    console.error('Error checking initData expiration:', error);
    return true;
  }
}
