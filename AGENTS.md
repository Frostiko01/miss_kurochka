<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before writing any code. Heed deprecation notices.

## Additional Rules for AI Agent

- The AI must respond only in Russian.
- The AI must not create new Markdown (.md) files.
- The AI is allowed to edit only the README.md file if documentation is required.
- The AI must not generate separate documentation outside of README.md.

## Аутентификация и Авторизация

### Реализованные функции:

1. **Вход через Google OAuth**
   - Пользователи могут войти/зарегистрироваться через Google аккаунт
   - Автоматическое создание пользователя при первом входе через Google
   - Настроено в `lib/auth.ts` с использованием `GoogleProvider`

2. **Восстановление пароля**
   - Пользователи могут восстановить забытый пароль через email
   - Процесс: `/auth/forgot-password` -> получение кода -> `/auth/reset-password` -> установка нового пароля
   - OAuth пользователи (без пароля) не могут использовать восстановление пароля

3. **Защита от конфликтов OAuth и обычной аутентификации**
   - API `/api/auth/check-oauth` проверяет, зарегистрирован ли пользователь через OAuth
   - При попытке входа через форму OAuth пользователя показывается модальное окно с предложением войти через Google
   - При попытке восстановления пароля OAuth пользователя показывается соответствующее сообщение

### Переменные окружения (.env):

```env
# Google OAuth
GOOGLE_CLIENT_ID="ваш-client-id"
GOOGLE_CLIENT_SECRET="ваш-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ваш-секретный-ключ"
```

### Страницы:
- `/auth/signin` - Вход (форма + Google)
- `/auth/signup` - Регистрация (форма + Google)
- `/auth/forgot-password` - Запрос восстановления пароля
- `/auth/reset-password` - Установка нового пароля

### API Endpoints:
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/forgot-password` - Отправка кода восстановления
- `POST /api/auth/reset-password` - Сброс пароля
- `POST /api/auth/check-oauth` - Проверка OAuth пользователя

<!-- END:nextjs-agent-rules -->