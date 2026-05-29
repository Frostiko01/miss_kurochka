# ✅ Чеклист деплоя на Timeweb App Platform

## Перед деплоем

### 1. База данных
- [ ] PostgreSQL база создана и доступна извне
- [ ] Получена строка подключения DATABASE_URL
- [ ] Миграции выполнены: `npx prisma migrate deploy`

### 2. Репозиторий
- [ ] Код загружен в GitHub/GitLab/Bitbucket
- [ ] Файл `.env` НЕ в репозитории (проверьте `.gitignore`)
- [ ] Файлы `Dockerfile` и `.dockerignore` в корне проекта
- [ ] В `next.config.ts` добавлено `output: 'standalone'`

### 3. Переменные окружения (подготовьте заранее)
- [ ] `DATABASE_URL` - строка подключения к PostgreSQL
- [ ] `NEXTAUTH_SECRET` - сгенерирован (минимум 32 символа)
- [ ] `NEXTAUTH_URL` - ваш production домен
- [ ] `NEXT_PUBLIC_APP_URL` - ваш production домен
- [ ] `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`
- [ ] `OPEN_AI` - OpenAI API ключ
- [ ] `SMTP_*` - настройки email
- [ ] `ADMIN_TELEGRAM_BOT_TOKEN` и `ADMIN_TELEGRAM_USER_ID`
- [ ] `FINIK_*` - настройки платежной системы

## Процесс деплоя

### Шаг 1: Создание приложения в Timeweb
1. [ ] Войти в панель Timeweb Cloud
2. [ ] Перейти в App Platform
3. [ ] Создать новое приложение
4. [ ] Подключить репозиторий (GitHub/GitLab/Bitbucket)

### Шаг 2: Настройка параметров
- [ ] Фреймворк: **Docker**
- [ ] Ветка: **main** (или ваша основная)
- [ ] Dockerfile: **Dockerfile**
- [ ] Порт: **3000**
- [ ] Автодеплой: **Включен** ✅

### Шаг 3: Переменные окружения
Скопируйте все переменные из вашего локального `.env` в раздел "Переменные окружения" Timeweb, заменив:
- [ ] `localhost` на реальный хост базы данных
- [ ] `http://localhost:3000` на ваш production домен
- [ ] Все тестовые ключи на production ключи

### Шаг 4: Запуск деплоя
- [ ] Нажать "Создать приложение"
- [ ] Дождаться завершения сборки (5-10 минут)
- [ ] Проверить логи на наличие ошибок

## После деплоя

### 1. Проверка работоспособности
- [ ] Открыть технический домен `https://your-app.timeweb.cloud`
- [ ] Главная страница загружается
- [ ] Проверить `/api/health` (если создан)
- [ ] Авторизация работает
- [ ] База данных доступна

### 2. Настройка OAuth
- [ ] В Google Cloud Console добавить redirect URI:
  ```
  https://your-domain.com/api/auth/callback/google
  ```

### 3. Создание администратора
```bash
# Локально с production DATABASE_URL
export DATABASE_URL="postgresql://..."
npm run admin:create
```

### 4. Настройка домена (опционально)
- [ ] Добавить свой домен в Timeweb
- [ ] Настроить DNS записи
- [ ] Дождаться выпуска SSL сертификата
- [ ] Обновить `NEXTAUTH_URL` и `NEXT_PUBLIC_APP_URL`

## Команды для генерации секретов

```bash
# NEXTAUTH_SECRET (минимум 32 символа)
openssl rand -base64 32

# Или онлайн:
# https://generate-secret.vercel.app/32
```

## Формат FINIK_PRIVATE_KEY

Приватный ключ должен быть в одну строку с `\n`:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----
```

Используйте скрипт для конвертации:
```bash
npx tsx scripts/test-finik-key.ts
# Скопируйте из finik_key_for_env.txt
```

## Частые ошибки

### ❌ Приложение не запускается
**Причина:** Отсутствуют обязательные переменные окружения
**Решение:** Проверьте логи и добавьте недостающие переменные

### ❌ Ошибка подключения к БД
**Причина:** Неверный DATABASE_URL или БД недоступна
**Решение:** Проверьте строку подключения и доступность БД

### ❌ OAuth не работает
**Причина:** Не добавлен redirect URI в Google Console
**Решение:** Добавьте `https://your-domain.com/api/auth/callback/google`

### ❌ 500 Internal Server Error
**Причина:** Не установлен NEXTAUTH_SECRET
**Решение:** Сгенерируйте и добавьте NEXTAUTH_SECRET

## Полезные ссылки

- 📖 [Полная инструкция](./TIMEWEB_DEPLOY.md)
- 🐳 [Dockerfile](./Dockerfile)
- 🔧 [Документация Timeweb](https://timeweb.cloud/docs/app-platform)
- 🔐 [NextAuth.js](https://next-auth.js.org/)
- 🗄️ [Prisma](https://www.prisma.io/docs)

---

**Готово!** 🎉 Ваше приложение задеплоено на Timeweb App Platform!
