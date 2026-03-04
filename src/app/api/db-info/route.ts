import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || '';

  // Парсим DATABASE_URL и маскируем пароль
  let parsed = {
    fullMasked: databaseUrl,
    protocol: '',
    username: '',
    host: '',
    port: '',
    database: '',
    usesPgBouncer: false,
  };

  if (databaseUrl) {
    try {
      // postgres://username:password@host:port/database
      const match = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (match) {
        parsed = {
          fullMasked: databaseUrl.replace(/:[^@]+@/, ':***@'),
          protocol: 'postgres',
          username: match[1],
          host: match[3],
          port: match[4],
          database: match[5],
          usesPgBouncer: match[4] === '6543' || match[3].includes('pooler'),
        };
      }
    } catch (e) {
      parsed.fullMasked = 'Failed to parse DATABASE_URL';
    }
  }

  // Тестируем подключение
  let connectionStatus = 'unknown';
  let connectionError = null;
  try {
    await db.$queryRaw`SELECT 1`;
    connectionStatus = 'connected';
  } catch (e: any) {
    connectionStatus = 'error';
    connectionError = e.message;
  }

  return NextResponse.json({
    databaseUrl: parsed,
    connection: {
      status: connectionStatus,
      error: connectionError,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
    },
  });
}
