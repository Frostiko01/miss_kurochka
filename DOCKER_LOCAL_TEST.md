# 🐳 Локальное тестирование Docker-образа

Это руководство поможет вам протестировать Docker-образ локально перед деплоем на Timeweb.

## Предварительные требования

- Docker Desktop установлен и запущен
- PostgreSQL база данных доступна (локальная или удаленная)

## Шаг 1: Сборка образа

```bash
docker build -t miss-kurochka:latest .
```

Это займет 5-10 минут при первой сборке.

## Шаг 2: Создайте файл с переменными окружения

Создайте файл `.env.docker` (НЕ коммитьте его в Git!):

```bash
# Скопируйте из .env.production.example и заполните реальными значениями
DATABASE_URL=postgresql://username:password@host:5432/database_name
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
OPEN_AI=sk-your-openai-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Miss Kurochka <noreply@misskurochka.kg>
ADMIN_TELEGRAM_BOT_TOKEN=your-bot-token
ADMIN_TELEGRAM_USER_ID=your-user-id
FINIK_ENV=beta
FINIK_API_KEY=your-api-key
FINIK_ACCOUNT_ID=your-account-id
FINIK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
```

## Шаг 3: Запустите контейнер

```bash
docker run -p 3000:3000 --env-file .env.docker miss-kurochka:latest
```

Или с отдельными переменными:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  miss-kurochka:latest
```

## Шаг 4: Проверьте работу

Откройте в браузере:
```
http://localhost:3000
```

## Шаг 5: Проверьте логи

```bash
# Найдите ID контейнера
docker ps

# Посмотрите логи
docker logs <container-id>

# Следите за логами в реальном времени
docker logs -f <container-id>
```

## Шаг 6: Остановите контейнер

```bash
# Найдите ID контейнера
docker ps

# Остановите контейнер
docker stop <container-id>

# Удалите контейнер
docker rm <container-id>
```

## Полезные команды

### Войти в контейнер (для отладки)
```bash
docker run -it --env-file .env.docker miss-kurochka:latest sh
```

### Проверить размер образа
```bash
docker images miss-kurochka
```

### Очистить неиспользуемые образы
```bash
docker system prune -a
```

### Пересобрать образ без кэша
```bash
docker build --no-cache -t miss-kurochka:latest .
```

## Тестирование миграций

### Выполнить миграции внутри контейнера
```bash
docker run --env-file .env.docker miss-kurochka:latest npx prisma migrate deploy
```

## Проблемы и решения

### Ошибка: "Cannot connect to database"
**Решение:** 
- Если база данных на localhost, используйте `host.docker.internal` вместо `localhost`
- Пример: `postgresql://user:pass@host.docker.internal:5432/db`

### Ошибка: "NEXTAUTH_SECRET is not set"
**Решение:** Убедитесь, что переменная установлена в `.env.docker`

### Образ слишком большой
**Решение:** Dockerfile уже оптимизирован с multi-stage build. Размер должен быть ~200-300 MB.

## Сравнение с production

| Параметр | Локально | Timeweb |
|----------|----------|---------|
| Порт | 3000 | 3000 |
| База данных | Локальная или удаленная | Внешняя (обязательно) |
| Переменные | `.env.docker` файл | Панель Timeweb |
| SSL | Нет | Автоматически (Let's Encrypt) |
| Домен | localhost:3000 | your-app.timeweb.cloud |

## Готово к деплою?

Если локальное тестирование прошло успешно, вы готовы к деплою на Timeweb!

📖 См. [QUICK_START.md](./QUICK_START.md) для быстрого деплоя.
