# Обновление паролей филиалов на Production

## Текущее состояние
✅ Код изменен и запушен в GitHub
✅ Локально пароли обновлены на `123123`

## Следующие шаги для Production

### Вариант 1: Через Timeweb SSH (РЕКОМЕНДУЕТСЯ)

1. Подключитесь к серверу Timeweb через SSH
2. Перейдите в директорию проекта
3. Выполните команды:

```bash
# Обновить код из GitHub
git pull origin main

# Установить зависимости (если нужно)
npm install

# Запустить скрипт обновления паролей
npx tsx scripts/set-branch-password.ts
```

### Вариант 2: Локально с Production DATABASE_URL

1. Сохраните текущий `.env` файл
2. Временно замените `DATABASE_URL` на production URL
3. Выполните:

```bash
npx tsx scripts/set-branch-password.ts
```

4. Верните обратно локальный `.env`

⚠️ **ВАЖНО**: Будьте осторожны с production данными!

### Вариант 3: Через Timeweb Web Console

1. Откройте панель Timeweb App Platform
2. Перейдите в раздел "Терминал" или "SSH"
3. Выполните команды из Варианта 1

## Проверка после обновления

После обновления паролей проверьте вход:

```bash
# Тест паролей
npx tsx scripts/test-branch-password.ts
```

Или вручную:
- URL: https://miss-kurochka.com/branch/signin
- Email: branch1@gmail.com (или branch2/branch3)
- Пароль: 123123

## Данные для входа филиалов

| Филиал | Email | Пароль |
|--------|-------|--------|
| Московская 208 | branch1@gmail.com | 123123 |
| Тыныстанова 104 | branch2@gmail.com | 123123 |
| Куттубаева 15/1 | branch3@gmail.com | 123123 |
