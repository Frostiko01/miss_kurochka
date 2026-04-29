# 🍗 Miss Kurochka PWA

Progressive Web Application для сети ресторанов быстрого питания Miss Kurochka.

## 🚀 Быстрый старт

```bash
# 1. Установите зависимости
npm install

# 2. Настройте базу данных
cp .env.example .env
# Отредактируйте .env и укажите DATABASE_URL

# 3. Создайте таблицы и заполните тестовыми данными
npm run db:push
npm run db:seed

# 4. Запустите dev сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

📖 **Подробная инструкция**: [QUICKSTART.md](./QUICKSTART.md)

## ✨ Возможности

- 🏢 **Управление филиалами** - несколько точек с индивидуальными настройками
- 🍔 **Гибкое меню** - категории, блюда, модификаторы, фото
- 🛒 **Заказы** - самовывоз и доставка
- 💳 **Платежи** - наличные, карты, Finik
- 🚚 **Доставка** - зоны доставки с геолокацией
- 🌍 **Мультиязычность** - русский, английский, кыргызский
- 📊 **Аналитика** - статистика популярных блюд
- 🎯 **Маркетинг** - баннеры и акции

## 🏗️ Технологии

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Finik Integration

## 📁 Структура проекта

```
miss-kurochka/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── branches/      # Филиалы
│   │   ├── menu/          # Меню
│   │   └── orders/        # Заказы
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── prisma.ts          # Prisma Client
├── prisma/
│   ├── schema.prisma      # Схема БД
│   ├── seed.ts            # Тестовые данные
│   └── README.md          # Документация схемы
├── public/                # Статические файлы
├── .env.example           # Пример переменных окружения
├── QUICKSTART.md          # Быстрый старт
├── ARCHITECTURE.md        # Архитектура БД
└── API_EXAMPLES.md        # Примеры API
```

## 📊 База данных

### Основные таблицы

- **users** - пользователи (admin, branch, customer)
- **branches** - филиалы сети
- **menu_categories** - категории меню
- **menu_items** - позиции меню
- **modifier_groups** - группы модификаторов
- **orders** - заказы
- **payments** - платежи
- **delivery_zones** - зоны доставки

📖 **Полная документация**: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Prisma Studio

Откройте GUI для работы с базой данных:

```bash
npm run db:studio
```

## 🔧 Доступные команды

```bash
# Development
npm run dev              # Запустить dev сервер
npm run build            # Собрать для продакшена
npm run start            # Запустить продакшен сервер
npm run lint             # Проверить код

# Database
npm run db:generate      # Сгенерировать Prisma Client
npm run db:push          # Синхронизировать схему с БД
npm run db:migrate       # Создать миграцию
npm run db:seed          # Заполнить тестовыми данными
npm run db:studio        # Открыть Prisma Studio
npm run db:reset         # Сбросить БД (ОСТОРОЖНО!)
```

## 📡 API Endpoints

### Филиалы
```bash
GET /api/branches        # Получить все филиалы
```

### Меню
```bash
GET /api/menu            # Получить меню
GET /api/menu?branchId=uuid  # Меню конкретного филиала
```

### Заказы
```bash
POST /api/orders         # Создать заказ
GET /api/orders          # Получить заказы
GET /api/orders?customerId=uuid  # Заказы клиента
```

📖 **Примеры использования**: [API_EXAMPLES.md](./API_EXAMPLES.md)

## 🧪 Тестовые данные

После выполнения `npm run db:seed`:

- **Администратор**: admin@misskurochka.kg
- **Филиал**: Miss Kurochka - Центр
- **Категории**: Курица, Бургеры, Напитки
- **Блюда**: Крылышки (350 сом), Бургер (280 сом), Кола (80 сом)
- **Модификаторы**: Соусы, Дополнительные ингредиенты

## 🔐 Безопасность

- ✅ Переменные окружения в `.env` (не в Git)
- ✅ Хэширование паролей
- ✅ Параметризованные запросы (Prisma)
- ✅ Валидация входных данных
- ✅ HTTPS для продакшена

## 📚 Документация

- [QUICKSTART.md](./QUICKSTART.md) - Быстрый старт
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура БД
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Примеры API
- [prisma/README.md](./prisma/README.md) - Работа с Prisma

## 🤝 Разработка

### Добавление новой таблицы

1. Обновите `prisma/schema.prisma`
2. Создайте миграцию: `npm run db:migrate`
3. Обновите seed: `prisma/seed.ts`

### Добавление API endpoint

1. Создайте файл в `app/api/[name]/route.ts`
2. Используйте `prisma` из `@/lib/prisma`
3. Добавьте примеры в `API_EXAMPLES.md`

## 📝 Лицензия

Proprietary - Miss Kurochka

## 🆘 Поддержка

Возникли проблемы? Проверьте:
- [QUICKSTART.md](./QUICKSTART.md) - решение частых проблем
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
