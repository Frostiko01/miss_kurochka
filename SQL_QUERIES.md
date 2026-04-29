# 🔍 Полезные SQL запросы для Miss Kurochka

## 📊 Аналитика и отчеты

### Топ-10 популярных блюд за период
```sql
SELECT 
  mi.name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.total_price) as total_revenue,
  COUNT(DISTINCT oi.order_id) as order_count
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= '2026-04-01' 
  AND o.created_at < '2026-05-01'
  AND o.status = 'completed'
GROUP BY mi.id, mi.name
ORDER BY total_sold DESC
LIMIT 10;
```

### Выручка по филиалам за день
```sql
SELECT 
  b.name as branch_name,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value
FROM orders o
JOIN branches b ON o.branch_id = b.id
WHERE DATE(o.created_at) = CURRENT_DATE
  AND o.status = 'completed'
GROUP BY b.id, b.name
ORDER BY total_revenue DESC;
```

### Статистика заказов по часам
```sql
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
  AND status = 'completed'
GROUP BY hour
ORDER BY hour;
```

### Средний чек по типу заказа
```sql
SELECT 
  order_type,
  COUNT(*) as order_count,
  AVG(total_amount) as avg_check,
  MIN(total_amount) as min_check,
  MAX(total_amount) as max_check
FROM orders
WHERE status = 'completed'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY order_type;
```

### Конверсия заказов (от создания до завершения)
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status
ORDER BY count DESC;
```

## 🍔 Меню и блюда

### Блюда с модификаторами
```sql
SELECT 
  mi.name as dish_name,
  mg.name as modifier_group,
  mg.selection_type,
  mg.is_required,
  mo.name as option_name,
  mo.price_delta
FROM menu_items mi
JOIN menu_item_modifiers mim ON mi.id = mim.menu_item_id
JOIN modifier_groups mg ON mim.modifier_group_id = mg.id
JOIN modifier_options mo ON mg.id = mo.group_id
WHERE mi.is_active = true
  AND mg.is_active = true
  AND mo.is_active = true
ORDER BY mi.name, mg.name, mo.name;
```

### Блюда в стоп-листе
```sql
SELECT 
  b.name as branch_name,
  mi.name as dish_name,
  sl.reason,
  sl.stopped_at,
  sl.expected_return_at,
  u.full_name as stopped_by
FROM stop_list sl
JOIN branches b ON sl.branch_id = b.id
JOIN menu_items mi ON sl.menu_item_id = mi.id
JOIN users u ON sl.stopped_by = u.id
WHERE sl.restored_at IS NULL
ORDER BY sl.stopped_at DESC;
```

### Категории с количеством блюд
```sql
SELECT 
  mc.name as category_name,
  COUNT(mi.id) as items_count,
  COUNT(CASE WHEN mi.is_active THEN 1 END) as active_items,
  AVG(mi.price) as avg_price
FROM menu_categories mc
LEFT JOIN menu_items mi ON mc.id = mi.category_id
WHERE mc.status = 'active'
GROUP BY mc.id, mc.name
ORDER BY items_count DESC;
```

## 🧾 Заказы

### Детали заказа с модификаторами
```sql
SELECT 
  o.order_number,
  o.customer_name,
  mi.name as dish_name,
  oi.quantity,
  oi.unit_price,
  mo.name as modifier,
  oim.price_delta as modifier_price,
  oi.total_price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN menu_items mi ON oi.menu_item_id = mi.id
LEFT JOIN order_item_modifiers oim ON oi.id = oim.order_item_id
LEFT JOIN modifier_options mo ON oim.modifier_option_id = mo.id
WHERE o.order_number = 'ORD-1714000000000';
```

### Заказы с задержкой
```sql
SELECT 
  o.order_number,
  b.name as branch_name,
  o.customer_name,
  o.customer_phone,
  o.status,
  o.created_at,
  EXTRACT(EPOCH FROM (NOW() - o.created_at))/60 as minutes_elapsed
FROM orders o
JOIN branches b ON o.branch_id = b.id
WHERE o.status IN ('pending', 'confirmed', 'preparing')
  AND o.created_at < NOW() - INTERVAL '30 minutes'
ORDER BY o.created_at;
```

### История заказов клиента
```sql
SELECT 
  o.order_number,
  o.created_at,
  o.status,
  o.total_amount,
  COUNT(oi.id) as items_count
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_phone = '+996555123456'
GROUP BY o.id, o.order_number, o.created_at, o.status, o.total_amount
ORDER BY o.created_at DESC
LIMIT 20;
```

## 💳 Платежи

### Статистика по способам оплаты
```sql
SELECT 
  payment_method,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM payments
WHERE status = 'completed'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY payment_method
ORDER BY total_amount DESC;
```

### Неоплаченные заказы
```sql
SELECT 
  o.order_number,
  o.customer_name,
  o.customer_phone,
  o.total_amount,
  p.status as payment_status,
  o.created_at
FROM orders o
JOIN payments p ON o.id = p.order_id
WHERE p.status IN ('pending', 'failed')
  AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY o.created_at DESC;
```

## 🚚 Доставка

### Заказы по зонам доставки
```sql
SELECT 
  dz.name as zone_name,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as revenue,
  AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/60) as avg_delivery_minutes
FROM orders o
JOIN branches b ON o.branch_id = b.id
JOIN delivery_zones dz ON b.id = dz.branch_id
WHERE o.order_type = 'delivery'
  AND o.status = 'completed'
  AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dz.id, dz.name
ORDER BY order_count DESC;
```

### Адреса клиентов
```sql
SELECT 
  u.full_name,
  u.phone,
  da.label,
  da.address_line,
  da.apartment,
  da.is_default
FROM delivery_addresses da
JOIN users u ON da.user_id = u.id
WHERE u.id = 'user-uuid'
ORDER BY da.is_default DESC, da.created_at DESC;
```

## 👥 Пользователи и сотрудники

### Сотрудники филиалов
```sql
SELECT 
  b.name as branch_name,
  u.full_name,
  u.email,
  u.role,
  bu.assigned_at
FROM branch_users bu
JOIN branches b ON bu.branch_id = b.id
JOIN users u ON bu.user_id = u.id
WHERE b.status = 'active'
  AND u.is_active = true
ORDER BY b.name, u.full_name;
```

### Активность пользователей
```sql
SELECT 
  u.full_name,
  u.email,
  u.role,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent,
  MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.customer_id
WHERE u.role = 'customer'
GROUP BY u.id, u.full_name, u.email, u.role
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 50;
```

## 🏢 Филиалы

### График работы филиалов
```sql
SELECT 
  b.name as branch_name,
  CASE bs.day_of_week
    WHEN 0 THEN 'Понедельник'
    WHEN 1 THEN 'Вторник'
    WHEN 2 THEN 'Среда'
    WHEN 3 THEN 'Четверг'
    WHEN 4 THEN 'Пятница'
    WHEN 5 THEN 'Суббота'
    WHEN 6 THEN 'Воскресенье'
  END as day,
  bs.open_time,
  bs.close_time
FROM branch_schedules bs
JOIN branches b ON bs.branch_id = b.id
WHERE b.status = 'active'
ORDER BY b.name, bs.day_of_week;
```

### Производительность филиалов
```sql
SELECT 
  b.name as branch_name,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
  SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
  ROUND(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.id), 2) as completion_rate,
  SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as revenue
FROM branches b
LEFT JOIN orders o ON b.id = o.branch_id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.name
ORDER BY revenue DESC;
```

## 🎯 Маркетинг

### Активные баннеры
```sql
SELECT 
  title,
  subtitle,
  image_url,
  starts_at,
  expires_at,
  sort_order
FROM banners
WHERE is_active = true
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (expires_at IS NULL OR expires_at >= NOW())
ORDER BY sort_order;
```

## 🔧 Административные запросы

### Размер таблиц
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Количество записей в таблицах
```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Активные соединения
```sql
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query_start
FROM pg_stat_activity
WHERE datname = 'miss_kurochka'
ORDER BY query_start DESC;
```

### Медленные запросы (требует pg_stat_statements)
```sql
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 🧹 Очистка и обслуживание

### Удалить старые завершенные заказы (старше 1 года)
```sql
-- ОСТОРОЖНО! Сначала сделайте backup
DELETE FROM orders
WHERE status = 'completed'
  AND created_at < NOW() - INTERVAL '1 year';
```

### Архивировать старую статистику
```sql
-- Создайте архивную таблицу
CREATE TABLE popular_items_stats_archive AS
SELECT * FROM popular_items_stats
WHERE date < CURRENT_DATE - INTERVAL '6 months';

-- Удалите из основной таблицы
DELETE FROM popular_items_stats
WHERE date < CURRENT_DATE - INTERVAL '6 months';
```

### Vacuum и analyze
```sql
-- Освободить место и обновить статистику
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;
VACUUM ANALYZE menu_items;
```

## 📊 Создание представлений (Views)

### Представление: Активное меню
```sql
CREATE OR REPLACE VIEW active_menu AS
SELECT 
  mc.id as category_id,
  mc.name as category_name,
  mc.name_i18n as category_name_i18n,
  mi.id as item_id,
  mi.name as item_name,
  mi.name_i18n as item_name_i18n,
  mi.price,
  mi.is_featured,
  mi.is_new
FROM menu_categories mc
JOIN menu_items mi ON mc.id = mi.category_id
WHERE mc.status = 'active'
  AND mi.is_active = true
ORDER BY mc.name, mi.name;
```

### Представление: Статистика заказов
```sql
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
  DATE(created_at) as order_date,
  branch_id,
  order_type,
  status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
GROUP BY DATE(created_at), branch_id, order_type, status;
```

## 🔍 Полнотекстовый поиск

### Поиск блюд по названию и описанию
```sql
SELECT 
  name,
  description,
  price,
  ts_rank(
    to_tsvector('russian', name || ' ' || COALESCE(description, '')),
    to_tsquery('russian', 'курица')
  ) as rank
FROM menu_items
WHERE to_tsvector('russian', name || ' ' || COALESCE(description, '')) 
  @@ to_tsquery('russian', 'курица')
  AND is_active = true
ORDER BY rank DESC;
```

## 💡 Полезные функции

### Функция: Расчет расстояния между координатами
```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Радиус Земли в км
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  
  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon/2) * SIN(dLon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Использование:
SELECT 
  name,
  calculate_distance(42.8746, 74.5698, latitude, longitude) as distance_km
FROM branches
WHERE latitude IS NOT NULL
ORDER BY distance_km;
```

## 📝 Примечания

- Все запросы протестированы на PostgreSQL 14+
- Используйте `EXPLAIN ANALYZE` для анализа производительности
- Создавайте индексы для часто используемых полей
- Регулярно делайте VACUUM ANALYZE
- Всегда делайте backup перед удалением данных

## 🔐 Безопасность

- Используйте параметризованные запросы в приложении
- Ограничьте права пользователей БД
- Не храните пароли в открытом виде
- Логируйте критичные операции
