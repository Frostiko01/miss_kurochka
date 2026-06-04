# 🔧 Исправление ошибки UntrustedHost в NextAuth

## 🐛 Проблема

При деплое на production появляется ошибка:
```
[auth][error] UntrustedHost: Host must be trusted. URL was: https://miss-kurochka.com/api/auth/session
```

## ✅ Решение

NextAuth v5 требует явного указания доверенных хостов через переменные окружения.

### Шаг 1: Проверьте переменные окружения в панели Timeweb

В настройках вашего приложения на Timeweb добавьте/обновите следующие переменные:

```bash
# Основной URL приложения (с https://)
AUTH_URL=https://miss-kurochka.com

# Доверять хосту (обязательно для работы за прокси)
AUTH_TRUST_HOST=true

# NextAuth URL (должен совпадать с AUTH_URL)
NEXTAUTH_URL=https://miss-kurochka.com

# NextAuth секрет (используйте безопасный ключ минимум 32 символа)
NEXTAUTH_SECRET=ваш-безопасный-секретный-ключ-минимум-32-символа

# Публичный URL приложения
NEXT_PUBLIC_APP_URL=https://miss-kurochka.com
```

### Шаг 2: Генерация безопасного NEXTAUTH_SECRET

Если у вас ещё нет безопасного секрета, сгенерируйте его:

```bash
# Вариант 1: Используя openssl
openssl rand -base64 32

# Вариант 2: Используя Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Вариант 3: Онлайн генератор
# https://generate-secret.vercel.app/32
```

### Шаг 3: Пересоздайте деплой

После добавления переменных окружения:

1. Зайдите в панель Timeweb
2. Найдите ваше приложение
3. Нажмите "Пересобрать" или "Redeploy"
4. Дождитесь завершения деплоя

### Шаг 4: Проверка

После деплоя проверьте:

1. **Главная страница:** https://miss-kurochka.com
2. **Аутентификация:** https://miss-kurochka.com/auth/signin
3. **API сессии:** https://miss-kurochka.com/api/auth/session

Если всё работает, вы должны увидеть:
- ✅ Главная страница загружается без ошибок
- ✅ Можно войти/зарегистрироваться
- ✅ Нет ошибок в логах

## 📋 Чек-лист переменных окружения для production

Убедитесь, что у вас установлены все обязательные переменные:

### Обязательные для работы:
- ✅ `DATABASE_URL` - подключение к PostgreSQL
- ✅ `NEXTAUTH_URL` - URL приложения (https://miss-kurochka.com)
- ✅ `NEXTAUTH_SECRET` - секретный ключ (минимум 32 символа)
- ✅ `AUTH_URL` - URL для NextAuth v5 (https://miss-kurochka.com)
- ✅ `AUTH_TRUST_HOST` - установите в `true`
- ✅ `NEXT_PUBLIC_APP_URL` - публичный URL (https://miss-kurochka.com)

### Google OAuth (если используется):
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`

**⚠️ Важно:** В настройках Google OAuth Console добавьте:
- Authorized redirect URIs: `https://miss-kurochka.com/api/auth/callback/google`

### OpenAI (если используется):
- ✅ `OPEN_AI` - API ключ OpenAI

### Email (если используется):
- ✅ `SMTP_HOST`
- ✅ `SMTP_PORT`
- ✅ `SMTP_USER`
- ✅ `SMTP_PASSWORD`
- ✅ `SMTP_FROM`

### Telegram (для админ 2FA):
- ✅ `ADMIN_TELEGRAM_BOT_TOKEN`
- ✅ `ADMIN_TELEGRAM_USER_ID`

### Finik Pay (для платежей):
- ✅ `FINIK_ENV` - `beta` или `prod`
- ✅ `FINIK_API_KEY`
- ✅ `FINIK_ACCOUNT_ID`
- ✅ `FINIK_PRIVATE_KEY` (в одну строку с `\n`)

## 🚫 Частые ошибки

### ❌ Ошибка: "Invalid URL"
**Причина:** URL не начинается с `http://` или `https://`  
**Решение:** Используйте полный URL: `https://miss-kurochka.com`

### ❌ Ошибка: "NEXTAUTH_SECRET is too short"
**Причина:** Секрет короче 32 символов  
**Решение:** Сгенерируйте новый секрет (см. Шаг 2)

### ❌ Ошибка: "Callback URL mismatch" (Google OAuth)
**Причина:** URL не добавлен в Google Console  
**Решение:** Добавьте `https://miss-kurochka.com/api/auth/callback/google` в Authorized redirect URIs

## 📚 Дополнительные ресурсы

- [NextAuth.js v5 Documentation](https://authjs.dev/getting-started/introduction)
- [NextAuth.js Deployment Guide](https://authjs.dev/getting-started/deployment)
- [NextAuth.js Environment Variables](https://authjs.dev/getting-started/deployment#environment-variables)

## 💡 Подсказка

Если после всех действий ошибка всё ещё появляется:

1. **Проверьте логи:** В панели Timeweb → Логи приложения
2. **Убедитесь в переменных:** Проверьте, что все переменные установлены без опечаток
3. **Очистите кэш:** Иногда помогает полная пересборка приложения
4. **Проверьте DNS:** Убедитесь, что домен правильно настроен и SSL активен

---

**Обновлено:** 04.06.2026  
**Версия:** Miss Kurochka v0.1.0
