import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * POST /api/get-chat
 * Получает информацию о чате через Telegram Bot API
 */
export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN не задан' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId обязателен' },
        { status: 400 }
      );
    }

    console.log('[GET-CHAT] Запрос информации о чате:', chatId);

    // Запрашиваем информацию о чате через Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${chatId}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[GET-CHAT] Ошибка от Telegram API:', errorData);
      return NextResponse.json(
        { error: 'Не удалось получить информацию о чате', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      console.error('[GET-CHAT] Telegram API вернул ошибку:', data);
      return NextResponse.json(
        { error: 'Telegram API вернул ошибку', details: data },
        { status: 400 }
      );
    }

    const chat = data.result;

    // Если это группа и название есть, обновляем в базе данных
    if (chat.type === 'group' || chat.type === 'supergroup') {
      const chatIdNum = BigInt(chatId);

      // Обновляем название в базе данных
      const updatedGroup = await db.telegramGroup.upsert({
        where: { telegramId: chatIdNum },
        update: {
          title: chat.title || null,
          username: chat.username || null,
          type: chat.type,
        },
        create: {
          telegramId: chatIdNum,
          title: chat.title || null,
          username: chat.username || null,
          type: chat.type,
        }
      });

      console.log('[GET-CHAT] Группа обновлена:', updatedGroup);

      return NextResponse.json({
        success: true,
        chat: {
          id: updatedGroup.id,
          telegramId: updatedGroup.telegramId.toString(),
          title: updatedGroup.title,
          username: updatedGroup.username,
          type: updatedGroup.type
        }
      });
    }

    console.log('[GET-CHAT] Чат не является группой:', chat.type);

    return NextResponse.json({
      success: true,
      chat: {
        telegramId: chat.id,
        title: chat.title,
        username: chat.username,
        type: chat.type
      }
    });

  } catch (error) {
    console.error('[GET-CHAT] Ошибка:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при получении информации о чате',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}
