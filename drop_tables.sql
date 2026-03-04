-- Удаление таблиц в правильном порядке (сначала зависимые)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS telegram_groups CASCADE;
DROP TABLE IF EXISTS telegram_users CASCADE;
