import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/stats
 * Возвращает статистику и данные из базы данных
 */
export async function GET() {
  try {
    console.log('[STATS] Запрос статистики...');

    // Получаем количество записей
    const userCount = await db.telegramUser.count();
    const groupCount = await db.telegramGroup.count();
    const userGroupCount = await db.userGroup.count();
    const sessionCount = await db.userSession.count();

    // Получаем последних пользователей
    const recentUsers = await db.telegramUser.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Получаем последние группы
    const recentGroups = await db.telegramGroup.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Получаем последние связи
    const recentUserGroups = await db.userGroup.findMany({
      take: 10,
      orderBy: { joinedAt: 'desc' },
      include: {
        user: true,
        group: true
      }
    });

    // Получаем последние сессии
    const recentSessions = await db.userSession.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalGroups: groupCount,
        totalUserGroups: userGroupCount,
        totalSessions: sessionCount
      },
      data: {
        recentUsers: recentUsers.map(u => ({
          id: u.id,
          telegramId: u.telegramId,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username,
          isPremium: u.isPremium,
          createdAt: u.createdAt
        })),
        recentGroups: recentGroups.map(g => ({
          id: g.id,
          telegramId: g.telegramId.toString(),
          title: g.title,
          type: g.type,
          username: g.username,
          createdAt: g.createdAt
        })),
        recentUserGroups: recentUserGroups.map(ug => ({
          id: ug.id,
          user: {
            id: ug.user.id,
            firstName: ug.user.firstName,
            username: ug.user.username
          },
          group: {
            id: ug.group.id,
            telegramId: ug.group.telegramId.toString(),
            type: ug.group.type
          },
          role: ug.role,
          joinedAt: ug.joinedAt
        })),
        recentSessions: recentSessions.map(s => ({
          id: s.id,
          user: {
            id: s.user.id,
            firstName: s.user.firstName,
            username: s.user.username
          },
          chatInstance: s.chatInstance,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt
        }))
      }
    });

  } catch (error) {
    console.error('[STATS] Ошибка:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при получении статистики',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}
