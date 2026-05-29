# Руководство по тестированию Finik Pay

## Проблема с localhost

Finik API не может отправлять webhooks на `localhost`, так как это локальный адрес, недоступный из интернета.

## Решения для тестирования

### Вариант 1: Использование ngrok (Рекомендуется)

#### 1. Установите ngrok
```bash
# Windows (через Chocolatey)
choco install ngrok

# Или скачайте с https://ngrok.com/download
```

#### 2. Запустите ваше приложение
```bash
npm run dev
```

#### 3. Создайте туннель ngrok
```bash
ngrok http 3000
```

#### 4. Обновите .env файл
Скопируйте URL из ngrok (например, `https://abc123.ngrok.io`) и добавьте в `.env`:

```env
NEXT_PUBLIC_APP_URL="https://abc123.ngrok.io"
NEXTAUTH_URL="https://abc123.ngrok.io"
```

#### 5. Перезапустите приложение
```bash
# Ctrl+C для остановки
npm run dev
```

Теперь Finik сможет отправлять webhooks на ваш ngrok URL!

### Вариант 2: Использование localtunnel

```bash
# Установка
npm install -g localtunnel

# Запуск туннеля
lt --port 3000
```

Обновите `.env` с полученным URL.

### Вариант 3: Использование Cloudflare Tunnel

```bash
# Установка
npm install -g cloudflared

# Запуск туннеля
cloudflared tunnel --url http://localhost:3000
```

### Вариант 4: Тестирование на beta окружении

Для начального тестирования можно использовать beta окружение Finik:

```env
FINIK_ENV="beta"
```

В beta окружении подпись не требуется, и можно тестировать базовую функциональность.

## Проверка конфигурации

После настройки туннеля проверьте логи при создании платежа:

```
🌐 Using APP_URL: https://your-tunnel-url.com
🚀 Creating Finik payment: {
  url: 'https://api.acquiring.averspay.kg/v1/payment',
  ...
}
```

## Типичные ошибки

### 1. "Failed to connect to Finik API"

**Причины:**
- Неправильный API ключ
- Проблемы с сетью
- Неправильный формат запроса

**Решение:**
Проверьте логи для деталей:
```
❌ Fetch error details: {
  message: "...",
  url: "...",
  ...
}
```

### 2. "Payment URL not found in Finik response"

**Причины:**
- Finik вернул ошибку вместо редиректа
- Неправильные учетные данные

**Решение:**
Проверьте статус ответа в логах:
```
📡 Finik API Response: {
  status: 400,
  statusText: "Bad Request"
}
```

### 3. Webhook не приходит

**Причины:**
- Используется localhost
- Туннель не работает
- Неправильный webhookUrl

**Решение:**
- Убедитесь, что используете публичный URL
- Проверьте, что туннель активен
- Проверьте логи webhook endpoint

## Тестирование без webhook

Для базового тестирования можно временно отключить зависимость от webhook:

1. Создайте платеж
2. Оплатите через Finik QR
3. Вручную обновите статус заказа в БД:

```sql
UPDATE "Order" 
SET status = 'confirmed' 
WHERE id = 'your-order-id';

UPDATE "Payment" 
SET status = 'completed' 
WHERE "orderId" = 'your-order-id';
```

## Production настройка

Для production используйте реальный домен:

```env
NEXT_PUBLIC_APP_URL="https://misskurochka.kg"
NEXTAUTH_URL="https://misskurochka.kg"
FINIK_ENV="prod"
```

## Полезные команды

### Проверка текущей конфигурации
```bash
# Посмотреть переменные окружения
echo $NEXT_PUBLIC_APP_URL
echo $NEXTAUTH_URL
echo $FINIK_ENV
```

### Тестирование webhook локально
```bash
# Отправить тестовый webhook
curl -X POST http://localhost:3000/api/finik/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-payment-id",
    "transactionId": "test-transaction",
    "status": "succeeded",
    "amount": 5,
    "transactionDate": 1234567890,
    "clientId": "test-client"
  }'
```

## Мониторинг

Следите за логами при создании платежа:

```
✓ Using FINIK_PRIVATE_KEY from environment
🌐 Using APP_URL: https://...
🔐 Generating Finik signature...
✅ Signature generated successfully
🚀 Creating Finik payment: {...}
📤 Sending request to Finik...
✅ Request sent successfully
📡 Finik API Response: {...}
```

Если видите ошибку на любом из этапов - проверьте соответствующую секцию выше.
