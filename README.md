# 📱 Telegram Mini App - Идентификация пользователя и группы

Telegram Mini App с функцией идентификации пользователя и группы, из которой запущено приложение. Полностью готовое к деплою приложение на Next.js 16.

## ✨ Возможности

- ✅ **Идентификация пользователя** - автоматически получает данные пользователя из Telegram
- ✅ **Идентификация группы** - определяет группу/канал, из которой запущен апп
- ✅ **Безопасная валидация** - проверка данных через HMAC-SHA256
- ✅ **Красивый интерфейс** - современный UI на shadcn/ui
- ✅ **Адаптивный дизайн** - оптимизирован для мобильных устройств
- ✅ **Отслеживание сессий** - история посещений пользователей
- ✅ **Поддержка групп** - работает в личных чатах и группах

## 🛠 Технологии

- **Frontend**: Next.js 16, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM с SQLite
- **Authentication**: Telegram WebApp API с валидацией initData

## 📋 Требования

- Node.js 18+ или Bun
- Telegram бот (создается через @BotFather)
- Учетная запись Vercel для деплоя
- Учетная запись GitHub

## 🚀 Быстрый старт

### 1. Локальная разработка

```bash
# Установка зависимостей
bun install

# Применение миграций базы данных
bun run db:push

# Запуск сервера разработки
bun run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

> **Примечание**: В режиме разработки приложение покажет тестовые данные, если открыто не через Telegram.

### 2. Деплой на Vercel

Подробная инструкция по деплою находится в файле [`worklog.md`](./worklog.md).

Краткая версия:
1. Создайте репозиторий на GitHub
2. Загрузите код в репозиторий
3. Создайте проект на Vercel и подключите GitHub
4. Добавьте переменные окружения:
   - `DATABASE_URL=file:./db/custom.db`
   - `TELEGRAM_BOT_TOKEN=ваш_токен`
5. Задеплойте приложение

### 3. Настройка Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/botfather) командой `/newbot`
2. Сохраните токен бота
3. Создайте Mini App через [@BotFather](https://t.me/botfather) командой `/newapp`
4. Укажите URL вашего приложения на Vercel
5. Выберите типы чатов (личные и группы)
6. Готово! Откройте приложение по ссылке от BotFather

## 📁 Структура проекта

```
src/
├── app/
│   ├── api/telegram/auth/    # API для аутентификации
│   ├── page.tsx              # Главная страница с UI
│   ├── layout.tsx            # Layout приложения
│   └── globals.css           # Глобальные стили
├── components/ui/            # shadcn/ui компоненты
├── lib/
│   ├── db.ts                 # Prisma клиент
│   ├── telegram.ts           # Утилиты для Telegram
│   └── utils.ts              # Общие утилиты
└── hooks/
    ├── use-toast.ts          # Toast хук
    └── use-mobile.ts         # Mobile detection

prisma/
└── schema.prisma             # Схема базы данных

worklog.md                    # Документация проекта
```

## 🗄️ База данных

Приложение использует следующие модели:

### TelegramUser
- telegramId - уникальный ID в Telegram
- firstName, lastName - имя пользователя
- username - @username
- photoUrl - URL аватара
- isPremium - статус Premium

### TelegramGroup
- telegramId - ID группы
- title - название группы
- type - тип (group, supergroup, channel)
- username - @username группы

### UserGroup
- Связь пользователей с группами
- role - роль (member, admin, creator)

### UserSession
- Отслеживание сессий пользователей
- IP адрес и User Agent

## 🔒 Безопасность

- Валидация initData через HMAC-SHA256
- Проверка срока действия данных (24 часа)
- Защита от подделки данных
- Безопасное хранение токенов

## 📱 Использование

### В личном чате
1. Откройте Mini App по ссылке от BotFather
2. Приложение покажет ваши данные пользователя
3. Список групп будет пустым

### В группе
1. Добавьте бота в группу
2. Дайте боту права администратора
3. Откройте Mini App из группы
4. Приложение покажет данные группы и вашу роль

## 📝 Документация

Полная документация проекта находится в файле [`worklog.md`](./worklog.md), включая:

- 📋 Дорожная карта проекта
- 📝 История разработки
- 🚀 Инструкция по настройке GitHub и Vercel
- 🤖 Инструкция по созданию Telegram бота и Mini App
- 🔍 Решение типичных проблем

## 🐛 Проблемы и решения

### "Невалидные данные Telegram"
- Убедитесь, что `TELEGRAM_BOT_TOKEN` добавлен в переменные окружения Vercel
- Откройте приложение именно через Telegram

### "Данные группы не показываются"
- Убедитесь, что открываете приложение из группы
- Проверьте, что боту даны права администратора
- Проверьте настройки Mini App (должен быть доступен в группах)

Более подробные решения в [`worklog.md`](./worklog.md).

## 🔄 Обновление кода

После деплоя:

```bash
# Внесите изменения в код
git add .
git commit -m "Описание изменений"
git push

# Vercel автоматически задеплоит изменения
```

## 📚 Полезные ресурсы

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 📄 Лицензия

Этот проект создан в учебных целях.

## 🤝 Поддержка

Если у вас есть вопросы или проблемы:
1. Проверьте [`worklog.md`](./worklog.md) - там много полезной информации
2. Посмотрите раздел "Проблемы и решения" выше
3. Обратитесь к документации Telegram Mini Apps

---

Создано с помощью [Z.ai](https://chat.z.ai) 🚀
