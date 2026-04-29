# Miss Kurochka - Prisma Database Schema

## 📋 Обзор архитектуры

Эта схема реализует полную базу данных для PWA приложения Miss Kurochka со следующими возможностями:

### ✨ Ключевые особенности:
- **Мягкое удаление** - через поля `deletedAt` (где необходимо)
- **Мультиязычность** - через JSONB поля `name_i18n`, `description_i18n`
- **Модификаторы блюд** - гибкая система с группами и опциями
- **Finik платежи** - интеграция платежной системы
- **Геолокация** - координаты филиалов и адресов доставки
- **Аналитика** - статистика популярных блюд

## 🗂️ Структура базы данных

### 👤 Пользователи и авторизация
- `users` - пользователи системы (admin, branch, customer)

### 🏢 Филиалы
- `branches` - филиалы сети
- `branch_schedules` - график работы
- `branch_users` - сотрудники филиалов

### 🍔 Меню
- `menu_categories` - категории меню (с иерархией)
- `menu_items` - позиции меню
- `menu_item_images` - фотографии блюд
- `stop_list` - временно недоступные блюда

### ⚙️ Модификаторы
- `modifier_groups` - группы модификаторов (single/multiple)
- `modifier_options` - опции модификаторов
- `menu_item_modifiers` - связь блюд с модификаторами

### 🧾 Заказы
- `orders` - заказы
- `order_items` - позиции в заказе
- `order_item_modifiers` - выбранные модификаторы

### 💳 Платежи
- `payments` - платежи (cash, card, finik, online)

### 🚚 Доставка
- `delivery_zones` - зоны доставки с полигонами
- `delivery_addresses` - адреса пользователей

### 🎯 Маркетинг
- `banners` - баннеры и акции

### 📊 Аналитика
- `popular_items_stats` - статистика популярных блюд

### ⚙️ Настройки
- `system_settings` - системные настройки (key-value в JSONB)

## 🚀 Начало работы

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Скопируйте `.env.example` в `.env` и настройте подключение к PostgreSQL:
```bash
cp .env.example .env
```

Отредактируйте `DATABASE_URL` в `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/miss_kurochka?schema=public"
```

### 3. Создание базы данных
```bash
# Создайте базу данных в PostgreSQL
createdb miss_kurochka
```

### 4. Применение миграций
```bash
# Создать и применить миграцию
npx prisma migrate dev --name init

# Или просто синхронизировать схему (для разработки)
npx prisma db push
```

### 5. Генерация Prisma Client
```bash
npx prisma generate
```

### 6. Открыть Prisma Studio (GUI для БД)
```bash
npx prisma studio
```

## 📝 Примеры использования

### Создание пользователя
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const user = await prisma.user.create({
  data: {
    email: 'admin@misskurochka.kg',
    fullName: 'Администратор',
    role: 'admin',
    passwordHash: 'hashed_password_here'
  }
})
```

### Создание филиала с графиком работы
```typescript
const branch = await prisma.branch.create({
  data: {
    name: 'Miss Kurochka - Центр',
    address: 'ул. Чуй 123, Бишкек',
    phone: '+996555123456',
    city: 'Bishkek',
    latitude: 42.8746,
    longitude: 74.5698,
    schedules: {
      create: [
        { dayOfWeek: 0, openTime: new Date('1970-01-01T09:00:00'), closeTime: new Date('1970-01-01T22:00:00') },
        { dayOfWeek: 1, openTime: new Date('1970-01-01T09:00:00'), closeTime: new Date('1970-01-01T22:00:00') },
        // ... остальные дни
      ]
    }
  }
})
```

### Создание блюда с модификаторами
```typescript
// Создаем группу модификаторов
const sauceGroup = await prisma.modifierGroup.create({
  data: {
    name: 'Выбор соуса',
    nameI18n: {
      ru: 'Выбор соуса',
      en: 'Choose sauce',
      ky: 'Соусту тандоо'
    },
    selectionType: 'single',
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    options: {
      create: [
        { name: 'Кетчуп', priceDelta: 0, isDefault: true },
        { name: 'Майонез', priceDelta: 0 },
        { name: 'Острый', priceDelta: 10 }
      ]
    }
  }
})

// Создаем блюдо
const menuItem = await prisma.menuItem.create({
  data: {
    categoryId: 'category-uuid',
    name: 'Куриные крылышки',
    nameI18n: {
      ru: 'Куриные крылышки',
      en: 'Chicken wings',
      ky: 'Тоок канаттары'
    },
    price: 350,
    weightGrams: 250,
    cookingTimeMinutes: 15,
    isActive: true,
    modifiers: {
      create: [
        { modifierGroupId: sauceGroup.id, sortOrder: 1 }
      ]
    },
    images: {
      create: [
        { imageUrl: '/images/wings.jpg', isPrimary: true }
      ]
    }
  }
})
```

### Создание заказа
```typescript
const order = await prisma.order.create({
  data: {
    orderNumber: 'ORD-2026-0001',
    branchId: 'branch-uuid',
    customerId: 'user-uuid',
    customerName: 'Иван Иванов',
    customerPhone: '+996555123456',
    orderType: 'delivery',
    paymentMethod: 'finik',
    totalAmount: 850,
    items: {
      create: [
        {
          menuItemId: 'menu-item-uuid',
          quantity: 2,
          unitPrice: 350,
          totalPrice: 700,
          modifiers: {
            create: [
              { modifierOptionId: 'modifier-option-uuid', priceDelta: 10 }
            ]
          }
        }
      ]
    },
    payments: {
      create: {
        paymentMethod: 'finik',
        amount: 850,
        currency: 'KGS',
        status: 'pending'
      }
    }
  },
  include: {
    items: {
      include: {
        modifiers: true
      }
    },
    payments: true
  }
})
```

### Получение популярных блюд
```typescript
const popularItems = await prisma.popularItemsStats.findMany({
  where: {
    branchId: 'branch-uuid',
    date: {
      gte: new Date('2026-04-01'),
      lte: new Date('2026-04-30')
    }
  },
  include: {
    menuItem: {
      include: {
        images: true
      }
    }
  },
  orderBy: {
    quantitySold: 'desc'
  },
  take: 10
})
```

## 🔧 Полезные команды

```bash
# Создать новую миграцию
npx prisma migrate dev --name migration_name

# Применить миграции в продакшене
npx prisma migrate deploy

# Сбросить базу данных (ОСТОРОЖНО!)
npx prisma migrate reset

# Обновить Prisma Client после изменений схемы
npx prisma generate

# Проверить статус миграций
npx prisma migrate status

# Форматировать schema.prisma
npx prisma format

# Валидация схемы
npx prisma validate
```

## 📚 Дополнительная информация

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js with Prisma](https://www.prisma.io/nextjs)

## 🔐 Безопасность

- Всегда используйте переменные окружения для чувствительных данных
- Не коммитьте `.env` файлы в Git
- Используйте хэширование паролей (bcrypt, argon2)
- Валидируйте все входные данные
- Используйте Prisma параметризованные запросы (защита от SQL injection)
