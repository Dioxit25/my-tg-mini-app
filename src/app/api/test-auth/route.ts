import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const result = {
    status: 'error',
    steps: [] as any[],
    error: null as any,
  };

  try {
    // Шаг 1: Проверка Prisma
    result.steps.push({ step: 1, name: 'Проверка Prisma Client', status: 'starting' });
    try {
      // Простая проверка подключения
      await db.$queryRaw`SELECT 1`;
      result.steps[0].status = 'ok';
      result.steps[0].details = 'Prisma подключен успешно';
    } catch (e: any) {
      result.steps[0].status = 'error';
      result.steps[0].error = e.message;
      throw new Error(`Prisma connection failed: ${e.message}`);
    }

    // Шаг 2: Поиск пользователя
    result.steps.push({ step: 2, name: 'Поиск пользователя в базе', status: 'starting' });
    try {
      const testUserId = 123456789n; // Тестовый ID
      const user = await db.telegramUser.findUnique({
        where: { telegramId: testUserId }
      });
      result.steps[1].status = 'ok';
      result.steps[1].details = user ? `Пользователь найден: ${user.firstName}` : 'Пользователь не найден (это нормально)';
    } catch (e: any) {
      result.steps[1].status = 'error';
      result.steps[1].error = e.message;
      throw new Error(`Find user failed: ${e.message}`);
    }

    // Шаг 3: Создание тестового пользователя
    result.steps.push({ step: 3, name: 'Создание тестового пользователя', status: 'starting' });
    try {
      const testUser = await db.telegramUser.create({
        data: {
          telegramId: BigInt(Date.now()), // Уникальный ID
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          languageCode: 'ru',
          isPremium: false,
        }
      });
      result.steps[2].status = 'ok';
      result.steps[2].details = `Пользователь создан: ${testUser.id}`;

      // Шаг 4: Получение пользователя
      result.steps.push({ step: 4, name: 'Получение пользователя с группами', status: 'starting' });
      try {
        const userWithGroups = await db.telegramUser.findUnique({
          where: { id: testUser.id },
          include: { groups: { include: { group: true } } }
        });
        result.steps[3].status = 'ok';
        result.steps[3].details = `Пользователь получен, групп: ${userWithGroups?.groups.length || 0}`;
      } catch (e: any) {
        result.steps[3].status = 'error';
        result.steps[3].error = e.message;
        throw new Error(`Get user with groups failed: ${e.message}`);
      }
    } catch (e: any) {
      result.steps[2].status = 'error';
      result.steps[2].error = e.message;
      throw new Error(`Create user failed: ${e.message}`);
    }

    result.status = 'success';
    return NextResponse.json(result);

  } catch (error: any) {
    result.error = {
      message: error.message,
      stack: error.stack,
    };
    return NextResponse.json(result, { status: 500 });
  }
}
