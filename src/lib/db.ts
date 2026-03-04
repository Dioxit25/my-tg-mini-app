import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Проверка соединения с базой данных (только для отладки)
if (process.env.NODE_ENV === 'production') {
  db.$connect()
    .then(() => {
      console.log('[DB] Успешное подключение к базе данных (PostgreSQL)')
    })
    .catch((error) => {
      console.error('[DB] Ошибка подключения к базе данных:', error)
    })
}