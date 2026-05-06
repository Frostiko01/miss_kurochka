-- Скрипт для быстрой настройки администратора
-- Используйте этот скрипт если автоматические скрипты не работают

-- 1. Создание администратора
-- ВАЖНО: Замените значения на свои!
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  full_name, 
  role, 
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@misskurochka.kg',  -- Замените на свой email
  '$2a$10$YourHashedPasswordHere',  -- Замените на хеш вашего пароля
  'Администратор',  -- Замените на свое имя
  'admin',
  'active',
  NOW(),
  NOW()
);

-- 2. Настройка Telegram User ID
-- ВАЖНО: Замените YOUR_TELEGRAM_USER_ID на ваш реальный User ID
INSERT INTO system_settings (id, key, value) 
VALUES (
  gen_random_uuid(), 
  'ADMIN_TELEGRAM_USER_ID', 
  'YOUR_TELEGRAM_USER_ID'  -- Например: '123456789'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- 3. Настройка Telegram Bot Token
-- ВАЖНО: Замените YOUR_BOT_TOKEN на токен вашего бота
INSERT INTO system_settings (id, key, value) 
VALUES (
  gen_random_uuid(), 
  'ADMIN_TELEGRAM_BOT_TOKEN', 
  'YOUR_BOT_TOKEN'  -- Например: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- 4. Проверка настроек
SELECT * FROM system_settings WHERE key LIKE 'ADMIN_TELEGRAM%';

-- 5. Проверка администратора
SELECT id, email, full_name, role, status FROM users WHERE role = 'admin';

-- ============================================
-- Генерация хеша пароля через Node.js:
-- ============================================
-- 
-- const bcrypt = require('bcryptjs');
-- const password = 'your-password';
-- const hash = bcrypt.hashSync(password, 10);
-- console.log(hash);
--
-- Или используйте скрипт:
-- npm run admin:create
-- ============================================

-- ============================================
-- Получение Telegram User ID:
-- ============================================
-- 
-- 1. Откройте @userinfobot в Telegram
-- 2. Отправьте любое сообщение
-- 3. Скопируйте ваш User ID
--
-- Или через API:
-- curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
-- ============================================
