# 🗄️ Схема базы данных Miss Kurochka

## 📊 Визуальная схема

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MISS KUROCHKA DATABASE                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        👤 ПОЛЬЗОВАТЕЛИ                                   │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   users     │
    ├─────────────┤
    │ id          │──┐
    │ email       │  │
    │ username    │  │
    │ full_name   │  │
    │ role        │  │  (admin, branch, customer)
    │ is_active   │  │
    └─────────────┘  │
                     │
┌────────────────────┼──────────────────────────────────────────────────────┐
│                    │              🏢 ФИЛИАЛЫ                              │
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
    ┌────────────────┼──────────┐
    │  branch_users  │          │
    ├────────────────┼──────────┤
    │ branch_id      │──────┐   │
    │ user_id        │◄─────┘   │
    │ assigned_by    │          │
    └────────────────┘          │
                                │
    ┌───────────────────────────┼───┐
    │      branches             │   │
    ├───────────────────────────┼───┤
    │ id                        │◄──┘
    │ name                      │
    │ address                   │
    │ phone                     │
    │ latitude, longitude       │
    │ status                    │
    │ min_order_amount          │
    └───────────────────────────┘
              │
              ├──────────────────────┐
              │                      │
    ┌─────────▼──────────┐  ┌────────▼──────────┐
    │ branch_schedules   │  │  delivery_zones   │
    ├────────────────────┤  ├───────────────────┤
    │ branch_id          │  │ branch_id         │
    │ day_of_week        │  │ name              │
    │ open_time          │  │ polygon_coords    │
    │ close_time         │  │ delivery_fee      │
    └────────────────────┘  └───────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          🍔 МЕНЮ                                         │
└──────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │  menu_categories     │
    ├──────────────────────┤
    │ id                   │──┐
    │ branch_id            │  │
    │ name                 │  │
    │ name_i18n (JSONB)    │  │
    │ parent_id (self-ref) │  │
    │ status               │  │
    └──────────────────────┘  │
                              │
    ┌─────────────────────────┼────┐
    │    menu_items           │    │
    ├─────────────────────────┼────┤
    │ id                      │◄───┘
    │ category_id             │
    │ name                    │
    │ name_i18n (JSONB)       │
    │ description_i18n        │
    │ price                   │
    │ weight_grams            │
    │ cooking_time_minutes    │
    │ calories, proteins...   │
    │ is_vegetarian, is_vegan │
    │ is_featured, is_new     │
    └─────────────────────────┘
              │
              ├──────────────────────┐
              │                      │
    ┌─────────▼──────────┐  ┌────────▼──────────────┐
    │ menu_item_images   │  │  menu_item_modifiers  │
    ├────────────────────┤  ├───────────────────────┤
    │ menu_item_id       │  │ menu_item_id          │
    │ image_url          │  │ modifier_group_id     │──┐
    │ is_primary         │  │ sort_order            │  │
    └────────────────────┘  └───────────────────────┘  │
                                                        │
    ┌───────────────────┐                              │
    │    stop_list      │                              │
    ├───────────────────┤                              │
    │ branch_id         │                              │
    │ menu_item_id      │                              │
    │ reason            │                              │
    │ stopped_by        │                              │
    │ restored_by       │                              │
    └───────────────────┘                              │

┌──────────────────────────────────────────────────────────────────────────┐
│                       ⚙️ МОДИФИКАТОРЫ                                    │
└──────────────────────────────────────────────────────────────────────────┘
                                                        │
    ┌───────────────────────────────────────────────────┼──┐
    │         modifier_groups                           │  │
    ├───────────────────────────────────────────────────┼──┤
    │ id                                                │◄─┘
    │ branch_id                                         │
    │ name, name_i18n                                   │
    │ selection_type (single/multiple)                  │
    │ is_required                                       │
    │ min_selections, max_selections                    │
    └───────────────────────────────────────────────────┘
                      │
    ┌─────────────────▼──────────┐
    │   modifier_options         │
    ├────────────────────────────┤
    │ id                         │──┐
    │ group_id                   │  │
    │ name, name_i18n            │  │
    │ price_delta                │  │
    │ is_default                 │  │
    └────────────────────────────┘  │

┌──────────────────────────────────────────────────────────────────────────┐
│                          🧾 ЗАКАЗЫ                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼──┐
    │         orders                │  │
    ├───────────────────────────────┼──┤
    │ id                            │  │
    │ order_number                  │  │
    │ branch_id                     │  │
    │ customer_id                   │  │
    │ customer_name, phone          │  │
    │ order_type (pickup/delivery)  │  │
    │ status                        │  │
    │ payment_method                │  │
    │ total_amount                  │  │
    │ ready_at, delivered_at        │  │
    └───────────────────────────────┘  │
                      │                │
         ┌────────────┼────────────┐   │
         │            │            │   │
    ┌────▼─────┐ ┌───▼──────┐     │   │
    │ payments │ │order_items│     │   │
    ├──────────┤ ├───────────┤     │   │
    │ order_id │ │ order_id  │     │   │
    │ amount   │ │ menu_item │     │   │
    │ status   │ │ quantity  │     │   │
    │ finik_id │ │ unit_price│     │   │
    └──────────┘ └───────────┘     │   │
                      │             │   │
         ┌────────────▼─────────┐   │   │
         │ order_item_modifiers │   │   │
         ├──────────────────────┤   │   │
         │ order_item_id        │   │   │
         │ modifier_option_id   │◄──┘   │
         │ price_delta          │       │
         └──────────────────────┘       │

┌──────────────────────────────────────────────────────────────────────────┐
│                        🚚 ДОСТАВКА                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                                │
    ┌───────────────────────────────────────────┼──┐
    │       delivery_addresses                  │  │
    ├───────────────────────────────────────────┼──┤
    │ id                                        │  │
    │ user_id                                   │◄─┘
    │ address_line                              │
    │ apartment, entrance, floor                │
    │ latitude, longitude                       │
    │ is_default                                │
    └───────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      🎯 МАРКЕТИНГ & 📊 АНАЛИТИКА                         │
└──────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐      ┌─────────────────────────┐
    │    banners       │      │  popular_items_stats    │
    ├──────────────────┤      ├─────────────────────────┤
    │ id               │      │ branch_id               │
    │ title, subtitle  │      │ menu_item_id            │
    │ image_url        │      │ date                    │
    │ link_target      │      │ order_count             │
    │ is_active        │      │ quantity_sold           │
    │ starts_at        │      │ revenue                 │
    │ expires_at       │      └─────────────────────────┘
    │ created_by       │
    └──────────────────┘

    ┌──────────────────────┐
    │  system_settings     │
    ├──────────────────────┤
    │ id                   │
    │ key                  │
    │ value (JSONB)        │
    └──────────────────────┘
```

## 🔗 Основные связи

### One-to-Many (1:N)
```
Branch ──┬──> BranchSchedule
         ├──> DeliveryZone
         ├──> MenuCategory
         ├──> Order
         └──> StopList

MenuCategory ──> MenuItem

MenuItem ──┬──> MenuItemImage
           ├──> OrderItem
           └──> StopList

Order ──┬──> OrderItem
        └──> Payment

OrderItem ──> OrderItemModifier

ModifierGroup ──> ModifierOption

User ──┬──> Order
       ├──> DeliveryAddress
       └──> Banner
```

### Many-to-Many (N:M)
```
Branch ←──→ User (через branch_users)
MenuItem ←──→ ModifierGroup (через menu_item_modifiers)
```

### Self-referencing
```
MenuCategory ──> MenuCategory (parent_id)
```

## 📊 Статистика схемы

- **Всего таблиц:** 20
- **Enum типов:** 8
  - UserRole (admin, branch, customer)
  - BranchStatus (active, inactive)
  - CategoryStatus (active, inactive, archived)
  - SelectionType (single, multiple)
  - OrderType (pickup, delivery)
  - OrderStatus (pending, confirmed, preparing, ready, delivering, completed, cancelled)
  - PaymentMethodType (cash, card, finik, online)
  - PaymentStatus (pending, processing, completed, failed, refunded)

- **JSONB поля:** 8
  - name_i18n (категории, модификаторы)
  - description_i18n (блюда)
  - polygon_coordinates (зоны доставки)
  - value (системные настройки)

- **Геолокация:** 4 поля
  - branches: latitude, longitude
  - delivery_zones: polygon_coordinates
  - delivery_addresses: latitude, longitude

## 🎯 Ключевые особенности

### Мультиязычность
```json
{
  "ru": "Куриные крылышки",
  "en": "Chicken wings",
  "ky": "Тоок канаттары"
}
```

### Модификаторы
```
Группа: "Выбор соуса" (single, required)
  ├─ Кетчуп (+0 сом) [default]
  ├─ Майонез (+0 сом)
  └─ Острый (+10 сом)

Группа: "Дополнительно" (multiple, optional)
  ├─ Сыр (+30 сом)
  ├─ Бекон (+50 сом)
  └─ Огурцы (+15 сом)
```

### Жизненный цикл заказа
```
pending → confirmed → preparing → ready → delivering → completed
                                    ↓
                              cancelled (любой этап)
```

### Зоны доставки (GeoJSON)
```json
{
  "type": "Polygon",
  "coordinates": [[
    [74.5698, 42.8746],
    [74.5798, 42.8746],
    [74.5798, 42.8846],
    [74.5698, 42.8846],
    [74.5698, 42.8746]
  ]]
}
```

## 🔐 Индексы и ограничения

### Primary Keys
Все таблицы используют UUID как первичный ключ

### Unique Constraints
- users: email, username
- orders: order_number
- system_settings: key
- branch_users: (branch_id, user_id)
- menu_item_modifiers: (menu_item_id, modifier_group_id)
- popular_items_stats: (branch_id, menu_item_id, date)

### Foreign Keys
Все связи реализованы через внешние ключи с каскадным удалением где необходимо

## 📚 Дополнительно

Подробная документация:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Детальное описание архитектуры
- [prisma/README.md](./prisma/README.md) - Работа с Prisma
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Примеры запросов
