-- Скрипт для обновления существующих данных после миграции system_settings
-- Выполните этот скрипт ПОСЛЕ применения миграции (npm run db:push)

-- ============================================
-- 1. Проверка текущих данных
-- ============================================

SELECT key, value, pg_typeof(value) as type
FROM system_settings;

-- ============================================
-- 2. Обновление данных Telegram (если они были в формате JSON)
-- ============================================

-- Если значения были в формате JSON с кавычками: "123456789"
-- Убираем кавычки для простых строковых значений
UPDATE system_settings 
SET value = TRIM(BOTH '"' FROM value::text)
WHERE key IN ('ADMIN_TELEGRAM_USER_ID', 'ADMIN_TELEGRAM_BOT_TOKEN')
  AND value LIKE '"%"';

-- ============================================
-- 3. Проверка результата
-- ============================================

SELECT key, value, length(value) as value_length
FROM system_settings
WHERE key LIKE 'ADMIN_TELEGRAM%';

-- Ожидаемый результат:
-- ADMIN_TELEGRAM_USER_ID    | 123456789                      | 9
-- ADMIN_TELEGRAM_BOT_TOKEN  | 1234567890:ABCdefGHIjklMNOpqrs | 35

-- ============================================
-- 4. Обновление сложных JSON структур (если есть)
-- ============================================

-- Для настроек приложения (app.name, app.currency, app.languages)
-- Они уже должны быть в правильном формате после seed
-- Но если нужно обновить вручную:

-- Пример для app.name:
UPDATE system_settings
SET value = '{"ru":"Miss Kurochka","en":"Miss Kurochka","ky":"Miss Kurochka"}'
WHERE key = 'app.name';

-- Пример для app.currency:
UPDATE system_settings
SET value = '{"code":"KGS","symbol":"сом"}'
WHERE key = 'app.currency';

-- Пример для app.languages:
UPDATE system_settings
SET value = '{"default":"ru","available":["ru","en","ky"]}'
WHERE key = 'app.languages';

-- ============================================
-- 5. Финальная проверка
-- ============================================

-- Проверяем все настройки
SELECT 
  key,
  CASE 
    WHEN length(value) > 50 THEN substring(value, 1, 50) || '...'
    ELSE value
  END as value_preview,
  length(value) as length
FROM system_settings
ORDER BY key;

-- ============================================
-- 6. Проверка типа поля в базе данных
-- ============================================

-- Должно показать: value | text | not null
-- \d system_settings

-- ============================================
-- ПРИМЕЧАНИЯ
-- ============================================

-- 1. Простые строковые значения хранятся как есть:
--    'ADMIN_TELEGRAM_USER_ID' -> '123456789'
--
-- 2. Сложные структуры хранятся как JSON строки:
--    'app.config' -> '{"theme":"dark","language":"ru"}'
--
-- 3. При чтении сложных структур в коде используйте JSON.parse():
--    const config = JSON.parse(setting.value);
--
-- 4. При сохранении сложных структур используйте JSON.stringify():
--    value: JSON.stringify({ theme: 'dark' })
