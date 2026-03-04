import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Проверяем переменные окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const databaseUrl = process.env.DATABASE_URL;

    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasBotToken: !!botToken,
        botTokenLength: botToken?.length || 0,
        hasDatabaseUrl: !!databaseUrl,
        databaseUrlPrefix: databaseUrl?.substring(0, 20) + '...' || 'none',
      },
      database: {
        status: 'unknown',
      },
    };

    // Проверяем подключение к базе данных
    try {
      await db.$queryRaw`SELECT 1`;
      healthStatus.database.status = 'connected';
    } catch (dbError) {
      healthStatus.database.status = 'error';
      healthStatus.database.error = dbError instanceof Error ? dbError.message : 'Unknown database error';
    }

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
