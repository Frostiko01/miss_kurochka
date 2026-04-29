# ✅ Чеклист запуска Miss Kurochka PWA

## 📋 Перед началом работы

### 1. Установка зависимостей
```bash
npm install
```
- [ ] Зависимости установлены без ошибок
- [ ] Prisma установлена (проверьте: `npx prisma --version`)

### 2. Настройка PostgreSQL

#### Установка PostgreSQL
- [ ] PostgreSQL установлен
- [ ] PostgreSQL запущен

**Проверка:**
```bash
# Windows
# Проверьте в Services, что PostgreSQL запущен

# macOS/Linux
sudo systemctl status postgresql
# или
psql --version
```

#### Создание базы данных
```bash
# Войдите в PostgreSQL
psql -U postgres

# Выполните команды:
CREATE DATABASE miss_kurochka;
\q
```
- [ ] База данных `miss_kurochka` создана

### 3. Настройка переменных окружения

```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/miss_kurochka?schema=public"
NEXT_PUBLIC_API_URL=http://localhost:3000
```

- [ ] Файл `.env` создан
- [ ] `DATABASE_URL` настроен с правильным паролем
- [ ] Подключение к БД работает

**Проверка подключения:**
```bash
npx prisma db pull
# Должно выполниться без ошибок
```

### 4. Инициализация базы данных

```bash
# Создайте таблицы
npm run db:push
```
- [ ] Таблицы созданы без ошибок
- [ ] Prisma Client сгенерирован

```bash
# Заполните тестовыми данными
npm run db:seed
```
- [ ] Тестовые данные загружены
- [ ] Видите сообщения: ✅ Создан администратор, ✅ Создан филиал, и т.д.

### 5. Проверка данных

```bash
# Откройте Prisma Studio
npm run db:studio
```
- [ ] Prisma Studio открылся (http://localhost:5555)
- [ ] Видите таблицы с данными:
  - [ ] users (1 администратор)
  - [ ] branches (1 филиал)
  - [ ] menu_categories (3 категории)
  - [ ] menu_items (3 блюда)
  - [ ] modifier_groups (2 группы)
  - [ ] banners (1 баннер)

### 6. Запуск приложения

```bash
npm run dev
```
- [ ] Сервер запустился на http://localhost:3000
- [ ] Нет ошибок в консоли
- [ ] Страница открывается в браузере

### 7. Проверка API

Откройте в браузере или используйте curl:

```bash
# Проверьте филиалы
curl http://localhost:3000/api/branches
```
- [ ] API /api/branches работает
- [ ] Возвращает JSON с филиалом

```bash
# Проверьте меню
curl http://localhost:3000/api/menu
```
- [ ] API /api/menu работает
- [ ] Возвращает категории с блюдами

```bash
# Проверьте заказы
curl http://localhost:3000/api/orders
```
- [ ] API /api/orders работает
- [ ] Возвращает пустой массив (заказов пока нет)

## 🎯 Готово к разработке!

Если все пункты отмечены ✅, проект готов к работе!

## 🔧 Частые проблемы

### ❌ Ошибка подключения к БД

**Проблема:** `Can't reach database server`

**Решение:**
1. Проверьте, что PostgreSQL запущен
2. Проверьте пароль в `.env`
3. Попробуйте подключиться вручную:
   ```bash
   psql -U postgres -d miss_kurochka
   ```

### ❌ Prisma Client не найден

**Проблема:** `Cannot find module '@prisma/client'`

**Решение:**
```bash
npm run db:generate
```

### ❌ Ошибка при seed

**Проблема:** Ошибки при выполнении `npm run db:seed`

**Решение:**
1. Сбросьте базу:
   ```bash
   npm run db:reset
   ```
2. Заново выполните seed:
   ```bash
   npm run db:seed
   ```

### ❌ Порт 3000 занят

**Проблема:** `Port 3000 is already in use`

**Решение:**
```bash
# Найдите процесс
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Убейте процесс или используйте другой порт
PORT=3001 npm run dev
```

### ❌ tsx не найден

**Проблема:** `'tsx' is not recognized`

**Решение:**
```bash
npm install
# tsx должен установиться автоматически
```

## 📚 Следующие шаги

После успешного запуска:

1. **Изучите документацию:**
   - [ ] Прочитайте [README.md](./README.md)
   - [ ] Изучите [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [ ] Посмотрите [API_EXAMPLES.md](./API_EXAMPLES.md)

2. **Начните разработку:**
   - [ ] Создайте страницу меню
   - [ ] Добавьте корзину
   - [ ] Реализуйте создание заказа

3. **Настройте аутентификацию:**
   - [ ] Добавьте NextAuth.js или Clerk
   - [ ] Защитите API endpoints

4. **Подготовьте к деплою:**
   - [ ] Прочитайте [DEPLOYMENT.md](./DEPLOYMENT.md)
   - [ ] Выберите платформу (Vercel, VPS, Docker)

## 🎉 Успехов в разработке!

Если возникнут вопросы, обращайтесь к документации в проекте.
