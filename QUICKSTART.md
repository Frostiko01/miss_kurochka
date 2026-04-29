# 🚀 Быстрый старт - Miss Kurochka PWA

## Шаг 1: Установка зависимостей

```bash
npm install
```

## Шаг 2: Настройка базы данных

### 2.1 Установите PostgreSQL
- **Windows**: Скачайте с [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql@16`
- **Linux**: `sudo apt install postgresql postgresql-contrib`

### 2.2 Создайте базу данных

```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE miss_kurochka;

# Создайте пользователя (опционально)
CREATE USER kurochka_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE miss_kurochka TO kurochka_user;

# Выйдите
\q
```

### 2.3 Настройте переменные окружения

```bash
# Скопируйте пример
cp .env.example .env

# Отредактируйте .env и укажите ваши данные
# DATABASE_URL="postgresql://postgres:password@localhost:5432/miss_kurochka?schema=public"
```

## Шаг 3: Инициализация базы данных

```bash
# Создайте таблицы
npm run db:push

# Заполните тестовыми данными
npm run db:seed
```

## Шаг 4: Запуск приложения

```bash
# Запустите dev сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📊 Prisma Studio (GUI для БД)

```bash
npm run db:studio
```

Откроется веб-интерфейс на [http://localhost:5555](http://localhost:5555)

## 🔧 Полезные команды

```bash
# Генерация Prisma Client после изменений схемы
npm run db:generate

# Создание миграции
npm run db:migrate

# Применение миграций в продакшене
npm run db:migrate:deploy

# Сброс базы данных (ОСТОРОЖНО!)
npm run db:reset

# Открыть Prisma Studio
npm run db:studio
```

## 📝 Тестовые данные после seed

После выполнения `npm run db:seed` будут созданы:

- **Администратор**: admin@misskurochka.kg
- **Филиал**: Miss Kurochka - Центр (Бишкек)
- **Категории**: Курица, Бургеры, Напитки
- **Блюда**: Куриные крылышки, Чикен Бургер, Кока-Кола
- **Модификаторы**: Соусы, Дополнительные ингредиенты
- **Зона доставки**: Центр города
- **Баннер**: Открытие нового филиала

## 🏗️ Структура проекта

```
miss-kurochka/
├── app/                    # Next.js App Router
├── lib/
│   └── prisma.ts          # Prisma Client singleton
├── prisma/
│   ├── schema.prisma      # Схема базы данных
│   ├── seed.ts            # Тестовые данные
│   └── README.md          # Документация схемы
├── .env                   # Переменные окружения (не в Git)
├── .env.example           # Пример переменных
└── package.json
```

## 🔐 Безопасность

⚠️ **Важно**: Файл `.env` содержит чувствительные данные и не должен попадать в Git!

## 📚 Дополнительно

- [Документация Prisma](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Проблемы?

### Ошибка подключения к БД
```bash
# Проверьте, запущен ли PostgreSQL
# Windows: Проверьте в Services
# macOS/Linux:
sudo systemctl status postgresql
```

### Ошибка миграции
```bash
# Сбросьте базу и начните заново
npm run db:reset
```

### Prisma Client не найден
```bash
# Сгенерируйте клиент
npm run db:generate
```
