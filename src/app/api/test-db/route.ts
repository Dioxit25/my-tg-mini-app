import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/test-db
 * Тестирование подключения к базе данных
 */
export async function GET() {
  try {
    console.log('[TEST-DB] Начало проверки подключения к БД');

    // Проверяем переменную окружения
    const dbUrl = process.env.DATABASE_URL;
    console.log('[TEST-DB] DATABASE_URL задан:', !!dbUrl);

    if (!dbUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL не задан в переменных окружения' },
        { status: 500 }
      );
    }

    // Проверяем тип базы данных
    const isPostgres = dbUrl.includes('postgres://') || dbUrl.includes('postgresql://');
    console.log('[TEST-DB] Тип базы данных:', isPostgres ? 'PostgreSQL' : 'другая');

    // Проверяем подключение
    console.log('[TEST-DB] Проверка подключения...');
    await db.$connect();
    console.log('[TEST-DB] Подключение успешно!');

    // Проверяем наличие таблиц
    console.log('[TEST-DB] Проверка таблиц...');
    const userCount = await db.telegramUser.count();
    console.log('[TEST-DB] Пользователей в базе:', userCount);

    const groupCount = await db.telegramGroup.count();
    console.log('[TEST-DB] Групп в базе:', groupCount);

    await db.$disconnect();

    return NextResponse.json({
      success: true,
      databaseType: isPostgres ? 'PostgreSQL' : 'другая',
      connectionUrl: dbUrl.replace(/:[^:]*@/, ':****@'),
      userCount,
      groupCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TEST-DB] Ошибка:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при проверке базы данных',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
