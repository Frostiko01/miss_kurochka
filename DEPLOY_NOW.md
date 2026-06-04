# 🚀 Деплой на Timeweb - Быстрая инструкция

## ✅ Все исправлено и готово к деплою!

Все ошибки исправлены, проект успешно собирается. Теперь нужно задеплоить изменения.

## 📋 Шаг 1: Закоммитьте изменения

```bash
git add .
git commit -m "fix: исправлены ошибки деплоя (TypeScript, OpenAI, NextAuth UntrustedHost)"
git push origin main
```

## 🔧 Шаг 2: Обновите переменные окружения в Timeweb

Зайдите в панель Timeweb → Ваше приложение → Переменные окружения

### ⚠️ ОБЯЗАТЕЛЬНО добавьте/обновите:

```bash
# NextAuth v5 - URL приложения
AUTH_URL=https://miss-kurochka.com
NEXTAUTH_URL=https://miss-kurochka.com

# NextAuth v5 - доверять хосту
AUTH_TRUST_HOST=true

# Публичный URL
NEXT_PUBLIC_APP_URL=https://miss-kurochka.com

# NextAuth секрет (сгенерируйте новый!)
NEXTAUTH_SECRET=ваш-безопасный-секретный-ключ-минимум-32-символа
```

### 🔑 Как сгенерировать NEXTAUTH_SECRET:

В терминале выполните:
```bash
openssl rand -base64 32
```

Или онлайн: https://generate-secret.vercel.app/32

### 📝 Полный список обязательных переменных:

```bash
# База данных
DATABASE_URL=postgresql://user:password@host:5432/database

# Next.js
NEXT_PUBLIC_APP_URL=https://miss-kurochka.com

# NextAuth
AUTH_URL=https://miss-kurochka.com
NEXTAUTH_URL=https://miss-kurochka.com
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET=ваш-сгенерированный-секрет

# Google OAuth
GOOGLE_CLIENT_ID=ваш-client-id
GOOGLE_CLIENT_SECRET=ваш-client-secret

# OpenAI (для ИИ-помощника)
OPEN_AI=sk-ваш-openai-ключ

# Email (для восстановления пароля)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ваш-email@gmail.com
SMTP_PASSWORD=ваш-app-пароль
SMTP_FROM="Miss Kurochka <noreply@misskurochka.kg>"

# Telegram (для админ 2FA)
ADMIN_TELEGRAM_BOT_TOKEN=ваш-telegram-bot-token
ADMIN_TELEGRAM_USER_ID=ваш-telegram-user-id

# Finik Pay (для платежей)
FINIK_ENV=prod
FINIK_API_KEY=ваш-finik-api-key
FINIK_ACCOUNT_ID=ваш-finik-account-id
FINIK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nваш-ключ\n-----END PRIVATE KEY-----"
```

## 🗄️ Шаг 3: Примените изменения базы данных

После добавления переменных окружения нужно синхронизировать базу данных с новой схемой Prisma.

### Вариант 1: SSH подключение к серверу (рекомендуется)

Подключитесь к вашему серверу Timeweb по SSH и выполните:

```bash
cd /path/to/your/app
npx prisma db push
```

### Вариант 2: Через панель Timeweb

Если есть доступ к консоли через панель управления:

```bash
npx prisma db push
```

Эта команда добавит новую таблицу `newsletter_subscribers` в базу данных для функции подписки на рассылку.

## 🔄 Шаг 4: Пересоберите приложение

В панели Timeweb:
1. Найдите ваше приложение `miss-kurochka`
2. Нажмите кнопку **"Пересобрать"** или **"Redeploy"**
3. Дождитесь завершения деплоя (обычно 5-10 минут)

## ✅ Шаг 5: Проверьте работу

После успешного деплоя проверьте:

1. **Главная страница:** https://miss-kurochka.com
   - ✅ Должна загружаться без ошибок
   
2. **Аутентификация:** https://miss-kurochka.com/auth/signin
   - ✅ Форма входа работает
   - ✅ Вход через Google работает
   
3. **API сессии:** https://miss-kurochka.com/api/auth/session
   - ✅ Не должно быть ошибки UntrustedHost

4. **Подписка на рассылку:**
   - ✅ В футере работает кнопка "Подписаться на рассылку"
   - ✅ Модальное окно подписки открывается
   - ✅ Email успешно сохраняется в базу данных

5. **Логи приложения:**
   - ✅ Нет ошибок `[auth][error] UntrustedHost`
   - ✅ Приложение работает стабильно

## 🎯 Что было исправлено?

1. ✅ TypeScript ошибка с локалями ('en' удален)
2. ✅ OpenAI ленивая инициализация (не вызывает ошибку при сборке)
3. ✅ Prisma DATABASE_URL обработка пустых значений
4. ✅ NextAuth UntrustedHost (добавлены AUTH_URL и AUTH_TRUST_HOST)
5. ✅ Фото крылышек на лендинге (заменено яйцо на фото крылышек)
6. ✅ Описания блюд с несколькими вкусами (разделены на параграфы)
7. ✅ Иконки в полях ввода (исправлено наложение на placeholder)
8. ✅ Футер - работают все ссылки и навигация
9. ✅ Подписка на рассылку (API, модальное окно, интеграция в футер)

## 🆘 Если что-то не работает

### Google OAuth не работает?
Проверьте в Google Cloud Console:
- Authorized redirect URIs: `https://miss-kurochka.com/api/auth/callback/google`

### Ошибка "Invalid URL"?
Убедитесь что URL начинается с `https://`:
```bash
AUTH_URL=https://miss-kurochka.com  # ✅ Правильно
AUTH_URL=miss-kurochka.com           # ❌ Неправильно
```

### Ошибка "NEXTAUTH_SECRET too short"?
Секрет должен быть минимум 32 символа:
```bash
openssl rand -base64 32  # Сгенерирует достаточно длинный ключ
```

### Всё ещё есть UntrustedHost?
Проверьте:
1. `AUTH_TRUST_HOST=true` установлен
2. `AUTH_URL` и `NEXTAUTH_URL` совпадают
3. Приложение пересобрано после добавления переменных

## 📚 Дополнительная документация

- [FIX_UNTRUSTED_HOST.md](./FIX_UNTRUSTED_HOST.md) - Подробное руководство по NextAuth
- [CHANGELOG_DEPLOYMENT_FIX.md](./CHANGELOG_DEPLOYMENT_FIX.md) - Что было исправлено
- [.env.production.example](./.env.production.example) - Шаблон всех переменных

---

## 🎉 Готово!

После выполнения всех шагов ваше приложение должно работать на https://miss-kurochka.com

**Удачи с деплоем! 🚀**
