# 📁 Скрипты проекта Miss Kurochka

Коллекция утилитных скриптов для управления проектом.

## 🔐 Управление паролями и доступом

### `set-branch-password.ts` ⭐ ОСНОВНОЙ
Устанавливает единый пароль `123123` для всех пользователей-филиалов.

```bash
npx tsx scripts/set-branch-password.ts
```

**Использование:**
- Локальная БД: просто запустите команду
- Production БД: установите `DATABASE_URL` на production и запустите

### `test-branch-password.ts`
Проверяет, что все филиалы могут войти с паролем `123123`.

```bash
npx tsx scripts/test-branch-password.ts
```

**Вывод:** Список всех филиалов с результатом проверки пароля.

### `reset-branch-password.ts`
Сброс пароля конкретного филиала (старая версия).

### `update-production-passwords.ps1` (Windows)
PowerShell скрипт для безопасного обновления паролей на production.

```powershell
.\scripts\update-production-passwords.ps1 -ProductionUrl "postgresql://..."
```

### `update-production-passwords.sh` (Linux/Mac)
Bash скрипт для безопасного обновления паролей на production.

```bash
PRODUCTION_DATABASE_URL="postgresql://..." ./scripts/update-production-passwords.sh
```

## 👤 Управление пользователями

### `create-admin.ts`
Интерактивное создание администратора.

```bash
npm run admin:create
# или
npx tsx scripts/create-admin.ts
```

### `quick-create-admin.ts`
Быстрое создание админа без интерактивного режима.

### `make-admin.ts`
Повышение существующего пользователя до роли администратора.

### `list-admins.ts`
Список всех администраторов системы.

### `check-admin.ts`
Проверка существования и статуса конкретного админа.

### `check-users.ts`
Просмотр всех пользователей в системе.

### `check-branch-users.ts` ⭐
Детальная информация о всех пользователях-филиалах.

```bash
npx tsx scripts/check-branch-users.ts
```

**Показывает:**
- ID, email, имя, роль, статус
- Наличие пароля
- Связанные филиалы

### `create-test-user.ts`
Создание тестового пользователя для разработки.

## 🏢 Управление филиалами

### `delete-all-branches.ts`
⚠️ **ОПАСНО!** Удаляет все филиалы из БД.

```bash
npx tsx scripts/delete-all-branches.ts
```

### `test-branch-access.ts`
Проверка доступа филиала к API.

### `test-branch-login.ts` / `test-branch-login-detailed.ts`
Тестирование процесса входа для филиалов.

## 🗄️ База данных

### `seed-database.ts`
Заполнение БД тестовыми данными.

```bash
npm run db:seed
# или
npx tsx prisma/seed.ts
```

### `test-db-connection.ts` / `test-db.ts`
Проверка подключения к базе данных.

### `test-prisma.ts`
Тестирование Prisma Client.

### `clear-test-data.ts`
Очистка тестовых данных из БД.

### `cleanup-stale-orders.ts`
Удаление устаревших/зависших заказов.

## 📊 Меню и категории

### `check-menu-data.ts`
Проверка данных меню в БД.

### `test-menu-api.ts`
Тестирование API меню.

### `fix-category-types.ts`
Исправление типов категорий в БД.

## 💳 Finik Pay (Платежи)

### `test-finik-payment.ts`
Тестирование интеграции с Finik Pay.

### `test-finik-key.ts`
Проверка корректности приватного ключа Finik.

### `generate-rsa-keys.ts`
Генерация RSA ключей для Finik.

## 📱 Telegram

### `setup-telegram.ts`
Настройка Telegram бота для админ 2FA.

```bash
npm run admin:setup-telegram
# или
npx tsx scripts/setup-telegram.ts
```

### `init-telegram-settings.ts`
Инициализация настроек Telegram в БД.

### `sync-telegram-to-db.ts`
Синхронизация настроек Telegram с БД.

### `get-telegram-settings.ts`
Получение текущих настроек Telegram.

### `check-telegram-settings.ts`
Проверка конфигурации Telegram.

### `force-add-telegram.ts`
Принудительное добавление настроек Telegram.

### `test-telegram-send.ts`
Тестирование отправки сообщений в Telegram.

## 🤖 ИИ-помощник

### `test-ai-chat.ts`
Тестирование ИИ-чата с доступом к БД.

```bash
npx tsx scripts/test-ai-chat.ts
```

## 🎨 PWA и иконки

### `fix-pwa-icons.js`
Генерация PWA иконок с правильным padding.

```bash
node scripts/fix-pwa-icons.js
```

См. [README-PWA-ICONS.md](./README-PWA-ICONS.md) для деталей.

### `regenerate-icons.ts`
Регенерация всех иконок приложения.

## 🖼️ Миграция изображений

### `migrate-images-to-s3.ts`
Миграция изображений в S3-хранилище.

```bash
npm run migrate:images
# или
npx tsx scripts/migrate-images-to-s3.ts
```

## 🔧 Утилиты

### `test-phone-formatter.ts`
Тестирование форматирования номеров телефонов.

### `setup-admin.sql`
SQL скрипт для создания админа напрямую в БД.

---

## 📚 Документация

- [`PRODUCTION-UPDATE-PASSWORDS.md`](./PRODUCTION-UPDATE-PASSWORDS.md) - Инструкция по обновлению паролей на production
- [`README-PWA-ICONS.md`](./README-PWA-ICONS.md) - Подробная документация по PWA иконкам

---

## 🚀 Быстрый старт

### Первичная настройка проекта

1. **Создать админа:**
   ```bash
   npm run admin:create
   ```

2. **Настроить Telegram:**
   ```bash
   npm run admin:setup-telegram
   ```

3. **Заполнить БД:**
   ```bash
   npm run db:seed
   ```

### Обновление паролей филиалов

**Локально:**
```bash
npx tsx scripts/set-branch-password.ts
npx tsx scripts/test-branch-password.ts
```

**Production:**
```powershell
# Windows
.\scripts\update-production-passwords.ps1 -ProductionUrl "postgresql://..."

# Linux/Mac
PRODUCTION_DATABASE_URL="postgresql://..." ./scripts/update-production-passwords.sh
```

### Проверка системы

```bash
# Проверить филиалы
npx tsx scripts/check-branch-users.ts

# Проверить админов
npx tsx scripts/list-admins.ts

# Проверить БД
npx tsx scripts/test-db-connection.ts

# Проверить меню
npx tsx scripts/check-menu-data.ts
```

---

## ⚠️ Важные замечания

- **Резервное копирование:** Всегда делайте бэкап БД перед запуском скриптов изменения данных
- **Production:** Будьте осторожны при работе с production БД
- **Переменные окружения:** Убедитесь, что `.env` правильно настроен
- **Права доступа:** Некоторые скрипты требуют прав администратора БД

---

**Дата обновления:** 23 июня 2026
