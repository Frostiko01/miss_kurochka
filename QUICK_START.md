# 🚀 Быстрый старт - Деплой на Timeweb

## 1️⃣ Подготовка (5 минут)

### Создайте PostgreSQL базу данных
```bash
# Получите строку подключения в формате:
postgresql://username:password@host:5432/database_name?schema=public
```

### Сгенерируйте NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Подготовьте FINIK_PRIVATE_KEY (если нужен)
```bash
npx tsx scripts/test-finik-key.ts
# Скопируйте содержимое из finik_key_for_env.txt
```

## 2️⃣ Загрузите код в Git

```bash
git add .
git commit -m "Ready for Timeweb deployment"
git push origin main
```

## 3️⃣ Создайте приложение в Timeweb

1. Войдите в [Timeweb Cloud](https://timeweb.cloud)
2. Перейдите в **App Platform**
3. Нажмите **"Создать приложение"**
4. Подключите ваш репозиторий

### Настройки:
- **Фреймворк:** Docker
- **Ветка:** main
- **Dockerfile:** Dockerfile
- **Порт:** 3000
- **Автодеплой:** ✅ Включен

## 4️⃣ Добавьте переменные окружения

Скопируйте и вставьте в раздел "Переменные окружения":

```bash
# База данных
DATABASE_URL=postgresql://username:password@host:5432/database_name?schema=public

# Next.js (замените на ваш домен)
NEXT_PUBLIC_APP_URL=https://your-app.timeweb.cloud
NEXTAUTH_URL=https://your-app.timeweb.cloud
NEXTAUTH_SECRET=ваш-сгенерированный-секрет-32-символа

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# OpenAI
OPEN_AI=sk-your-openai-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Miss Kurochka <noreply@misskurochka.kg>

# Telegram (для админ 2FA)
ADMIN_TELEGRAM_BOT_TOKEN=your-bot-token
ADMIN_TELEGRAM_USER_ID=your-user-id

# Finik Pay
FINIK_ENV=prod
FINIK_API_KEY=your-api-key
FINIK_ACCOUNT_ID=your-account-id
FINIK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
```

## 5️⃣ Запустите деплой

Нажмите **"Создать приложение"** и дождитесь завершения сборки (5-10 минут).

## 6️⃣ Выполните миграции

```bash
# Локально с production DATABASE_URL
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

## 7️⃣ Создайте администратора

```bash
export DATABASE_URL="postgresql://..."
npm run admin:create
```

## 8️⃣ Настройте Google OAuth

В [Google Cloud Console](https://console.cloud.google.com):
1. Перейдите в **APIs & Services** → **Credentials**
2. Выберите ваш OAuth 2.0 Client
3. Добавьте в **Authorized redirect URIs**:
   ```
   https://your-app.timeweb.cloud/api/auth/callback/google
   ```

## ✅ Готово!

Откройте ваше приложение:
```
https://your-app.timeweb.cloud
```

---

## 🔄 Обновление приложения

После настройки автодеплоя просто делайте push:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Timeweb автоматически пересоберет и задеплоит приложение!

---

## 📚 Дополнительная документация

- 📖 [Полная инструкция](./TIMEWEB_DEPLOY.md)
- ✅ [Чеклист деплоя](./DEPLOY_CHECKLIST.md)
- 🐳 [Dockerfile](./Dockerfile)

---

## 🆘 Нужна помощь?

Проверьте логи в панели Timeweb или обратитесь в поддержку.
