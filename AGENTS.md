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

## ИИ-Помощник с доступом к базе данных

### Реализованные функции:

1. **Доступ к актуальным данным меню**
   - ИИ использует OpenAI Function Calling для получения данных из PostgreSQL через Prisma
   - Функция `get_menu_items` - поиск блюд с фильтрацией по категории, вегетарианству, цене
   - Возвращает: название, описание, цены всех размеров, состав, модификаторы

2. **Информация о комбо-предложениях**
   - Функция `get_combo_offers` - получение всех активных комбо-наборов
   - Возвращает: название, цену, старую цену (если есть скидка), состав комбо

3. **Дополнительные предложения**
   - Функция `get_additional_offers` - соусы, напитки, десерты
   - Фильтрация по категории (опционально)

4. **Информация о филиалах**
   - Функция `get_branches` - адреса, телефоны, минимальные суммы заказа
   - Среднее время приготовления

### Технические детали:

**API Endpoint:** `POST /api/ai/chat`

**Модель:** GPT-4o-mini с Function Calling

**Формат запроса:**
```json
{
  "messages": [
    { "role": "user", "content": "Какие у вас есть бургеры до 300 сом?" }
  ]
}
```

**Формат ответа:**
```json
{
  "reply": "У нас есть несколько бургеров до 300 сом: Чикен Бургер (250 сом), Классический Бургер (280 сом)..."
}
```

### Переменные окружения (.env):

```env
# OpenAI API
OPEN_AI="ваш-openai-api-key"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/miss_kurochka"
```

### Компоненты:
- `components/AiChatModal.tsx` - Модальное окно чата с ИИ
- Интеграция на главной странице с кнопкой вызова

### Тестирование:
```bash
# Проверка доступа к БД и симуляция запросов
npx tsx scripts/test-ai-chat.ts
```

### Примеры использования:

**Клиент:** "Сколько стоит Чикен Бургер?"
**ИИ:** Вызывает `get_menu_items` → Возвращает актуальные цены из БД

**Клиент:** "Что можете посоветовать вегетарианское до 200 сом?"
**ИИ:** Вызывает `get_menu_items` с фильтрами `isVegetarian=true, maxPrice=200`

**Клиент:** "Какие у вас есть комбо?"
**ИИ:** Вызывает `get_combo_offers` → Показывает все активные комбо с ценами

### Преимущества:
- ✅ Всегда актуальные данные из БД (цены, наличие, состав)
- ✅ Нет выдуманной информации - только реальные данные
- ✅ Персонализированные рекомендации на основе предпочтений
- ✅ Поддержка русского и кыргызского языков
- ✅ Автоматическая обработка сложных запросов через Function Calling

<!-- END:nextjs-agent-rules -->