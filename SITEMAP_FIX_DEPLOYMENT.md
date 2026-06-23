# 🔧 Исправление Sitemap для Production

## Проблема
Google Search Console показывал sitemap.xml с localhost URL вместо production домена:
- ❌ `http://localhost:3000/`
- ❌ `http://localhost:3000/menu`
- ✅ Должно быть: `https://miss-kurochka.com/menu`

## Что было исправлено

### 1. ✅ `.env` файл
```diff
- NEXT_PUBLIC_APP_URL="https://miss-kurochka.com/"
+ NEXT_PUBLIC_APP_URL="https://miss-kurochka.com"
```
Убрал trailing slash, который мог вызывать проблемы.

### 2. ✅ `Dockerfile` 
Обновлены default значения для build-time переменных:
```diff
- ENV NEXTAUTH_URL="http://localhost:3000"
- ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
+ ENV NEXTAUTH_URL="https://miss-kurochka.com"
+ ENV NEXT_PUBLIC_APP_URL="https://miss-kurochka.com"
```

### 3. ✅ Код уже был правильным
Файлы `app/sitemap.ts`, `app/robots.ts`, и `app/layout.tsx` уже используют правильный fallback:
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://miss-kurochka.com'
```

### 4. ✅ Тесты созданы
Созданы скрипты для проверки:
- `scripts/test-sitemap-generation.ts` - проверяет sitemap
- `scripts/test-robots-generation.ts` - проверяет robots.txt

## Тестирование локально

```bash
# Проверить sitemap генерацию
npx tsx scripts/test-sitemap-generation.ts

# Проверить robots.txt генерацию
npx tsx scripts/test-robots-generation.ts
```

## 🚀 Деплой инструкции

### Вариант 1: Timeweb App Platform (Рекомендуется)

1. **Откройте панель Timeweb**
2. **Перейдите в "Переменные окружения"**
3. **Убедитесь, что установлена переменная:**
   ```
   NEXT_PUBLIC_APP_URL=https://miss-kurochka.com
   ```
   ⚠️ **БЕЗ trailing slash в конце!**

4. **Пересоберите приложение:**
   - Нажмите "Пересобрать" или "Redeploy"
   - Или сделайте новый git push

5. **После деплоя проверьте:**
   ```bash
   curl https://miss-kurochka.com/sitemap.xml
   curl https://miss-kurochka.com/robots.txt
   ```

### Вариант 2: Docker на VPS

1. **Обновите docker-compose.yml или команду запуска:**
   ```yaml
   environment:
     - NEXT_PUBLIC_APP_URL=https://miss-kurochka.com
     - NEXTAUTH_URL=https://miss-kurochka.com
     - AUTH_URL=https://miss-kurochka.com
     - AUTH_TRUST_HOST=true
   ```

2. **Пересоберите и перезапустите:**
   ```bash
   docker build -t miss-kurochka:latest .
   docker stop miss-kurochka
   docker rm miss-kurochka
   docker run -d \
     --name miss-kurochka \
     -p 3000:3000 \
     -e NEXT_PUBLIC_APP_URL="https://miss-kurochka.com" \
     -e NEXTAUTH_URL="https://miss-kurochka.com" \
     -e AUTH_URL="https://miss-kurochka.com" \
     -e DATABASE_URL="..." \
     -e NEXTAUTH_SECRET="..." \
     # ... остальные переменные
     miss-kurochka:latest
   ```

### Вариант 3: PM2 на VPS

1. **Создайте `ecosystem.config.js`:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'miss-kurochka',
       script: 'node_modules/next/dist/bin/next',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         NEXT_PUBLIC_APP_URL: 'https://miss-kurochka.com',
         NEXTAUTH_URL: 'https://miss-kurochka.com',
         AUTH_URL: 'https://miss-kurochka.com',
         // ... остальные переменные
       }
     }]
   }
   ```

2. **Перезапустите:**
   ```bash
   npm run build
   pm2 restart ecosystem.config.js
   ```

## ✅ Проверка после деплоя

### 1. Проверьте sitemap.xml
```bash
curl https://miss-kurochka.com/sitemap.xml
```

**Ожидаемый результат:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://miss-kurochka.com</loc>
    <lastmod>2026-06-23T11:23:57.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://miss-kurochka.com/menu</loc>
    ...
  </url>
</urlset>
```

❌ **Если видите localhost** - переменная окружения не установлена!

### 2. Проверьте robots.txt
```bash
curl https://miss-kurochka.com/robots.txt
```

**Ожидаемый результат:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /branch/
Disallow: /api/
Disallow: /_next/
Disallow: /auth/verify-email
Disallow: /auth/reset-password

Sitemap: https://miss-kurochka.com/sitemap.xml
```

### 3. Проверьте metadata в HTML
```bash
curl https://miss-kurochka.com | grep -i "og:url\|canonical"
```

**Должно быть:**
```html
<link rel="canonical" href="https://miss-kurochka.com/">
<meta property="og:url" content="https://miss-kurochka.com/">
```

### 4. Отправьте sitemap в Google Search Console

1. Откройте [Google Search Console](https://search.google.com/search-console)
2. Перейдите в раздел "Файлы Sitemap"
3. Нажмите "Добавить новую карту сайта"
4. Введите: `sitemap.xml`
5. Нажмите "Отправить"

**Google покажет:**
- ✅ Обнаружено URL: 10
- ✅ Все URL начинаются с `https://miss-kurochka.com`

### 5. Проверьте индексацию (через 1-3 дня)

```bash
# Google поиск (в браузере)
site:miss-kurochka.com
```

## 🐛 Troubleshooting

### Проблема: Sitemap все еще показывает localhost

**Причина:** Переменная окружения `NEXT_PUBLIC_APP_URL` не установлена на production сервере.

**Решение:**
1. Проверьте переменные окружения на сервере
2. Убедитесь что используете HTTPS (не HTTP)
3. Убедитесь что НЕТ trailing slash в конце URL
4. Пересоберите приложение (`npm run build`)
5. Перезапустите сервер

### Проблема: 404 на /sitemap.xml

**Причина:** Next.js не сгенерировал sitemap.

**Решение:**
1. Проверьте что файл `app/sitemap.ts` существует
2. Убедитесь что сборка прошла успешно
3. Проверьте логи сборки на ошибки

### Проблема: Google не индексирует страницы

**Возможные причины:**
1. Sitemap был добавлен недавно (подождите 1-7 дней)
2. В robots.txt есть `Disallow: /` (проверьте)
3. Проблемы с SSL сертификатом
4. Сайт недоступен для Googlebot

**Проверка доступности для Google:**
```bash
curl -A "Googlebot" https://miss-kurochka.com
```

## 📊 Мониторинг

После деплоя следите за:

1. **Google Search Console**
   - Coverage (Покрытие)
   - Sitemaps (Карты сайта)
   - URL Inspection (Проверка URL)

2. **Логи сервера**
   - Запросы от Googlebot
   - Ошибки 404/500
   - Время ответа

3. **Метрики индексации**
   - Количество проиндексированных страниц
   - Ошибки сканирования
   - Исключенные страницы

## ✅ Checklist после деплоя

- [ ] `NEXT_PUBLIC_APP_URL=https://miss-kurochka.com` установлена на production
- [ ] Приложение пересобрано и перезапущено
- [ ] `https://miss-kurochka.com/sitemap.xml` открывается
- [ ] Sitemap НЕ содержит localhost URL
- [ ] `https://miss-kurochka.com/robots.txt` содержит правильный Sitemap URL
- [ ] Sitemap отправлен в Google Search Console
- [ ] Через 1-3 дня проверена индексация (`site:miss-kurochka.com`)
- [ ] В HTML нет localhost ссылок (canonical, og:url)

## 🎉 Готово!

После выполнения всех шагов:
- ✅ Sitemap будет генерироваться с правильными URL
- ✅ Google сможет индексировать сайт
- ✅ Все SEO метаданные будут корректными
- ✅ Canonical URL будут указывать на production домен

---

**Дата исправления:** 23 июня 2026  
**Исправленные файлы:**
- `.env` (убран trailing slash)
- `Dockerfile` (обновлены default значения)
- `scripts/test-sitemap-generation.ts` (новый)
- `scripts/test-robots-generation.ts` (новый)
