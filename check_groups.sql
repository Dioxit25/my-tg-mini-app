-- Проверка данных в базе данных
-- Запустите этот SQL в Supabase SQL Editor

-- 1. Проверить всех пользователей
SELECT * FROM telegram_users ORDER BY created_at DESC LIMIT 10;

-- 2. Проверить все группы
SELECT * FROM telegram_groups ORDER BY created_at DESC LIMIT 10;

-- 3. Проверить связи пользователей с группами
SELECT
  ug.id,
  u.first_name,
  u.username as user_username,
  g.telegram_id as group_id,
  g.type,
  ug.role,
  ug.joined_at
FROM user_groups ug
JOIN telegram_users u ON ug.user_id = u.id
JOIN telegram_groups g ON ug.group_id = g.id
ORDER BY ug.joined_at DESC;

-- 4. Проверить сессии
SELECT
  us.id,
  u.first_name,
  us.chat_instance,
  us.created_at,
  us.expires_at
FROM user_sessions us
JOIN telegram_users u ON us.user_id = u.id
ORDER BY us.created_at DESC
LIMIT 10;

-- 5. Статистика
SELECT
  (SELECT COUNT(*) FROM telegram_users) as total_users,
  (SELECT COUNT(*) FROM telegram_groups) as total_groups,
  (SELECT COUNT(*) FROM user_groups) as total_user_groups,
  (SELECT COUNT(*) FROM user_sessions) as total_sessions;
