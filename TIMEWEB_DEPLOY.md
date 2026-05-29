# 🚀 Инструкция по деплою на Timeweb App Platform

## 📋 Предварительные требования

### 1. Подготовка базы данных PostgreSQL
Перед деплоем создайте базу данных PostgreSQL в Timeweb Cloud или используйте внешний сервис (например, Supabase, Neon, или собственный сервер).

**Получите строку подключения в формате:**
```
postgresql://username:password@host:5432/database_name?schema=public
```

### 2. Подготовка репозитория
Убедитесь, что ваш код загружен в GitHub, GitLab или Bitbucket.

**Важно:** Файл `.env` не должен быть в репозитории (он уже в `.gitignore`).

---

## 🔧 Настройка проекта в Timeweb App Platform

### Шаг 1: Создание приложения

1. Войдите в панель управления Timeweb Cloud
2. Перейдите в раздел **App Platform**
3. Нажмите **"Создать приложение"**
4. Выберите источник кода:
   - GitHub / GitLab / Bitbucket (рекомендуется)
   - Или укажите публичную ссылку на репозиторий

### Шаг 2: Настройка параметров сборки

**Основные параметры:**
- **Фреймворк:** Docker
- **Ветка:** main (или ваша основная ветка)
- **Dockerfile:** `Dockerfile` (в корне проекта)
- **Порт:** `3000`

**Автодеплой:**
- ✅ Включите автоматический деплой при push в репозиторий

### Шаг 3: Настройка переменных окружения

В разделе **"Переменные окружения"** добавьте следующие переменные:

#### 🔐 Обязательные переменные

```bash
# База данных
DATABASE_URL=postgresql://username:password@host:5432/database_name?schema=public

# Next.js (замените на ваш домен)
NEXT_PUBLIC_APP_URL=https://your-app.timeweb.cloud

# NextAuth
NEXTAUTH_URL=https://your-app.timeweb.cloud
NEXTAUTH_SECRET=your-super-secret-key-min-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI API
OPEN_AI=sk-your-openai-api-key

# Email / SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Miss Kurochka <noreply@misskurochka.kg>

# Telegram Bot (для админ 2FA)
ADMIN_TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ADMIN_TELEGRAM_USER_ID=your-telegram-user-id

# Finik Pay
FINIK_ENV=prod
FINIK_API_KEY=your-finik-api-key
FINIK_ACCOUNT_ID=your-finik-account-id
FINIK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_CONTENT\n-----END PRIVATE KEY-----"
```

#### ⚠️ Важные замечания:

1. **NEXTAUTH_SECRET** — должен быть случайной строкой минимум 32 символа. Сгенерируйте:
   ```bash
   openssl rand -base64 32
   ```

2. **FINIK_PRIVATE_KEY** — должен быть в одну строку с `\n` вместо реальных переносов строк:
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----
   ```

3. **DATABASE_URL** — используйте внешнюю базу данных, так как данные в Docker-контейнере не сохраняются между деплоями.

---

## 🗄️ Миграция базы данных

### Вариант 1: Автоматическая миграция при деплое

Добавьте команду миграции в Dockerfile перед запуском приложения:

```dockerfile
# В секции CMD добавьте:
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

### Вариант 2: Ручная миграция (рекомендуется для первого деплоя)

После первого деплоя подключитесь к контейнеру через SSH (если доступно) или выполните миграцию локально:

```bash
# Установите DATABASE_URL для production базы
export DATABASE_URL="postgresql://..."

# Выполните миграции
npx prisma migrate deploy

# Сгенерируйте Prisma Client
npx prisma generate
```

### Создание первого администратора

После успешного деплоя и миграции создайте администратора:

```bash
# Локально с production DATABASE_URL
export DATABASE_URL="postgresql://..."
npm run admin:create
```

---

## 🌐 Настройка домена

### Технический домен
После деплоя Timeweb автоматически выдаст технический домен:
```
https://your-app-name.timeweb.cloud
```

### Собственный домен

1. В настройках приложения перейдите в раздел **"Домены"**
2. Нажмите **"Добавить домен"**
3. Укажите ваш домен (например, `misskurochka.kg`)
4. Настройте DNS-записи у вашего регистратора:
   ```
   A запись: @ -> IP-адрес из панели Timeweb
   CNAME: www -> your-app-name.timeweb.cloud
   ```
5. SSL-сертификат Let's Encrypt будет выпущен автоматически

**Важно:** После добавления домена обновите переменные окружения:
```bash
NEXT_PUBLIC_APP_URL=https://misskurochka.kg
NEXTAUTH_URL=https://misskurochka.kg
```

---

## 🔍 Проверка деплоя

### 1. Проверьте логи сборки
В панели Timeweb перейдите в раздел **"Логи"** и убедитесь, что:
- ✅ Зависимости установлены
- ✅ Prisma Client сгенерирован
- ✅ Next.js приложение собрано
- ✅ Контейнер запущен на порту 3000

### 2. Проверьте работу приложения
Откройте ваш домен в браузере и проверьте:
- ✅ Главная страница загружается
- ✅ Авторизация работает
- ✅ База данных доступна
- ✅ API endpoints отвечают

### 3. Проверьте переменные окружения
Создайте тестовый API endpoint для проверки:
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    database: !!process.env.DATABASE_URL,
    nextauth: !!process.env.NEXTAUTH_SECRET,
    openai: !!process.env.OPEN_AI,
  })
}
```

---

## 🐛 Решение проблем

### Проблема: Приложение не запускается

**Решение:**
1. Проверьте логи в панели Timeweb
2. Убедитесь, что все обязательные переменные окружения установлены
3. Проверьте, что DATABASE_URL корректен и база данных доступна

### Проблема: Ошибка подключения к базе данных

**Решение:**
1. Проверьте строку подключения DATABASE_URL
2. Убедитесь, что база данных доступна извне (не localhost)
3. Проверьте, что миграции выполнены: `npx prisma migrate deploy`

### Проблема: 500 Internal Server Error

**Решение:**
1. Проверьте логи приложения в Timeweb
2. Убедитесь, что NEXTAUTH_SECRET установлен
3. Проверьте, что все API keys корректны

### Проблема: OAuth не работает

**Решение:**
1. В Google Cloud Console добавьте ваш production домен в **Authorized redirect URIs**:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
2. Обновите NEXTAUTH_URL на production домен

---

## 📊 Мониторинг и обслуживание

### Логи
Регулярно проверяйте логи в панели Timeweb для выявления ошибок.

### Резервное копирование
Настройте автоматическое резервное копирование базы данных PostgreSQL.

### Обновления
При push в репозиторий (с включенным автодеплоем) приложение автоматически пересоберется и задеплоится.

---

## 📝 Чеклист перед деплоем

- [ ] База данных PostgreSQL создана и доступна
- [ ] Все переменные окружения настроены в Timeweb
- [ ] NEXTAUTH_SECRET сгенерирован (минимум 32 символа)
- [ ] Google OAuth настроен с production redirect URIs
- [ ] FINIK_PRIVATE_KEY в правильном формате (одна строка с \n)
- [ ] Код загружен в Git репозиторий
- [ ] Файл .env не в репозитории
- [ ] Dockerfile и .dockerignore созданы
- [ ] next.config.ts содержит `output: 'standalone'`
- [ ] Миграции базы данных выполнены
- [ ] Первый администратор создан

---

## 🎉 Готово!

После выполнения всех шагов ваше приложение будет доступно по адресу:
```
https://your-app.timeweb.cloud
```

Или по вашему собственному домену:
```
https://misskurochka.kg
```

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в панели Timeweb
2. Обратитесь в поддержку Timeweb
3. Проверьте документацию: https://timeweb.cloud/docs/app-platform
