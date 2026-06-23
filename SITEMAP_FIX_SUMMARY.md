# 📋 Отчет: Исправление Sitemap для Production

## ✅ Что было сделано

### 1. Исправленные файлы

#### `.env`
**Что было сломано:**
```env
NEXT_PUBLIC_APP_URL="https://miss-kurochka.com/"  # ❌ Trailing slash
```

**Что исправлено:**
```env
NEXT_PUBLIC_APP_URL="https://miss-kurochka.com"   # ✅ Без trailing slash
```

#### `Dockerfile`
**Что было сломано:**
```dockerfile
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"  # ❌ localhost + HTTP
ENV NEXTAUTH_URL="http://localhost:3000"         # ❌ localhost + HTTP
```

**Что исправлено:**
```dockerfile
ENV NEXT_PUBLIC_APP_URL="https://miss-kurochka.com"  # ✅ Production URL + HTTPS
ENV NEXTAUTH_URL="https://miss-kurochka.com"         # ✅ Production URL + HTTPS
```

### 2. Созданные тесты

✅ **`scripts/test-sitemap-generation.ts`**
- Проверяет генерацию sitemap.xml
- Убеждается что все URL используют production домен
- Находит localhost ссылки

✅ **`scripts/test-robots-generation.ts`**
- Проверяет генерацию robots.txt
- Убеждается что Sitemap URL правильный
- Проверяет правила индексации

✅ **`scripts/verify-production-seo.ts`**
- Полная проверка SEO конфигурации
- Проверяет все файлы (.env, sitemap.ts, robots.ts, layout.tsx, Dockerfile)
- Находит hardcoded localhost ссылки
- Проверяет robots metadata

### 3. Документация

✅ **`SITEMAP_FIX_DEPLOYMENT.md`**
- Подробные инструкции по деплою
- Примеры для Timeweb, Docker, PM2
- Checklist после деплоя
- Troubleshooting

## 📊 Результаты проверки

```
🔍 ПОЛНАЯ ПРОВЕРКА PRODUCTION SEO КОНФИГУРАЦИИ
======================================================================

✅ .env - NEXT_PUBLIC_APP_URL: https://miss-kurochka.com
✅ .env - NEXTAUTH_URL: https://miss-kurochka.com
✅ app/sitemap.ts - Fallback использует правильный production URL
✅ app/robots.ts - Fallback использует правильный production URL
✅ app/layout.tsx - metadataBase использует правильный production URL
✅ app/layout.tsx - Индексация разрешена (index: true)
✅ Dockerfile - NEXT_PUBLIC_APP_URL использует production URL

📈 Статистика: 7 OK, 0 предупреждений, 0 ошибок
```

## 🚀 Следующие шаги (ВАЖНО!)

### Шаг 1: Проверьте переменные окружения на сервере

**Timeweb App Platform:**
1. Откройте панель управления Timeweb
2. Перейдите в "Переменные окружения"
3. Проверьте/добавьте:
   ```
   NEXT_PUBLIC_APP_URL=https://miss-kurochka.com
   ```
   ⚠️ **БЕЗ trailing slash!**

**Docker/VPS:**
1. Проверьте docker-compose.yml или команду запуска
2. Убедитесь что передается:
   ```bash
   -e NEXT_PUBLIC_APP_URL="https://miss-kurochka.com"
   ```

### Шаг 2: Пересоберите приложение

Ваш код уже запушен в GitHub. Теперь нужно:

**Если используете Timeweb с auto-deploy:**
- Timeweb автоматически пересоберет приложение после git push ✅
- Дождитесь завершения деплоя (обычно 5-10 минут)

**Если используете Docker вручную:**
```bash
git pull origin main
docker build -t miss-kurochka:latest .
docker stop miss-kurochka
docker rm miss-kurochka
docker run -d \
  --name miss-kurochka \
  -p 3000:3000 \
  -e NEXT_PUBLIC_APP_URL="https://miss-kurochka.com" \
  -e NEXTAUTH_URL="https://miss-kurochka.com" \
  # ... остальные переменные
  miss-kurochka:latest
```

### Шаг 3: Проверьте sitemap после деплоя

**Через 5-10 минут после деплоя выполните:**

```bash
# Проверка sitemap.xml
curl https://miss-kurochka.com/sitemap.xml

# Проверка robots.txt
curl https://miss-kurochka.com/robots.txt
```

**Ожидаемый результат sitemap.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://miss-kurochka.com</loc>  <!-- ✅ НЕ localhost -->
    <lastmod>2026-06-23T11:23:57.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://miss-kurochka.com/menu</loc>  <!-- ✅ НЕ localhost -->
    ...
  </url>
</urlset>
```

**Ожидаемый результат robots.txt:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /branch/
Disallow: /api/
Disallow: /_next/
Disallow: /auth/verify-email
Disallow: /auth/reset-password

Sitemap: https://miss-kurochka.com/sitemap.xml  <!-- ✅ НЕ localhost -->
```

### Шаг 4: Отправьте sitemap в Google Search Console

1. Откройте [Google Search Console](https://search.google.com/search-console)
2. Выберите ваш сайт `miss-kurochka.com`
3. Перейдите: **Индексирование → Файлы Sitemap**
4. Если sitemap уже добавлен - удалите старый
5. Нажмите "Добавить новую карту сайта"
6. Введите: `sitemap.xml`
7. Нажмите "Отправить"

**Google должен показать:**
- ✅ Обнаружено URL: 10
- ✅ Все URL начинаются с `https://miss-kurochka.com`

### Шаг 5: Проверка через 24-48 часов

Google начнет переиндексацию. Проверьте через 1-2 дня:

```bash
# В браузере Google (или через поиск)
site:miss-kurochka.com
```

**Ожидаемое:**
- ✅ Появятся новые проиндексированные страницы
- ✅ Все URL будут `https://miss-kurochka.com/...`

## ❌ Если sitemap все еще показывает localhost

### Причина #1: Переменная окружения не установлена

**Проверка:**
```bash
# SSH в ваш сервер или через панель Timeweb
echo $NEXT_PUBLIC_APP_URL
```

**Решение:**
1. Установите переменную `NEXT_PUBLIC_APP_URL=https://miss-kurochka.com`
2. Перезапустите приложение

### Причина #2: Кэш Next.js

**Проверка:**
```bash
# В корне проекта на сервере
ls -la .next/
```

**Решение:**
```bash
# Очистите кэш и пересоберите
rm -rf .next
npm run build
# Перезапустите сервер
```

### Причина #3: Old build deployment

**Проверка:**
- Проверьте дату последнего коммита на production
- Убедитесь что это коммит `5d94620`

**Решение:**
```bash
git pull origin main
git log --oneline -n 1  # Должен быть: 5d94620 fix: исправлена генерация sitemap
# Пересоберите и перезапустите
```

## 📈 Итоговый Sitemap URL

```
https://miss-kurochka.com/sitemap.xml
```

**Содержит 10 URL:**
1. `https://miss-kurochka.com` (priority: 1.0)
2. `https://miss-kurochka.com/menu` (priority: 0.9)
3. `https://miss-kurochka.com/branches` (priority: 0.8)
4. `https://miss-kurochka.com/cart` (priority: 0.7)
5. `https://miss-kurochka.com/promotions` (priority: 0.8)
6. `https://miss-kurochka.com/auth/signin` (priority: 0.5)
7. `https://miss-kurochka.com/auth/signup` (priority: 0.5)
8. `https://miss-kurochka.com/support` (priority: 0.6)
9. `https://miss-kurochka.com/terms-of-service` (priority: 0.3)
10. `https://miss-kurochka.com/privacy-policy` (priority: 0.3)

## ✅ Подтверждение готовности к индексации Google

После выполнения всех шагов:

- [x] **Код исправлен и запушен в GitHub**
  - Коммит: `5d94620` "fix: исправлена генерация sitemap для production"
  - Branch: `main`
  - Remote: `origin`

- [ ] **Переменные окружения установлены на production сервере**
  - `NEXT_PUBLIC_APP_URL=https://miss-kurochka.com`
  - Проверьте в панели Timeweb или на VPS

- [ ] **Приложение пересобрано с новым кодом**
  - Дождитесь auto-deploy или запустите вручную
  - Проверьте логи сборки

- [ ] **sitemap.xml доступен и правильный**
  - `curl https://miss-kurochka.com/sitemap.xml`
  - НЕ содержит localhost

- [ ] **robots.txt доступен и правильный**
  - `curl https://miss-kurochka.com/robots.txt`
  - Sitemap URL правильный

- [ ] **Sitemap отправлен в Google Search Console**
  - Статус: "Успешно"
  - Обнаружено URL: 10

- [ ] **Индексация проверена (через 24-48 часов)**
  - `site:miss-kurochka.com` показывает страницы
  - URL правильные

## 📞 Нужна помощь?

**Если возникли проблемы:**

1. Запустите диагностику:
   ```bash
   npx tsx scripts/verify-production-seo.ts
   ```

2. Проверьте логи сервера:
   ```bash
   # Docker
   docker logs miss-kurochka
   
   # PM2
   pm2 logs miss-kurochka
   
   # Systemd
   journalctl -u miss-kurochka -f
   ```

3. Проверьте переменные окружения:
   ```bash
   # В контейнере
   docker exec miss-kurochka env | grep NEXT_PUBLIC_APP_URL
   
   # На сервере
   echo $NEXT_PUBLIC_APP_URL
   ```

## 🎉 Успех!

После выполнения всех шагов ваш сайт будет:
- ✅ Правильно индексироваться Google
- ✅ Sitemap содержит только production URL
- ✅ SEO оптимизирован для поисковых систем

---

**Дата:** 23 июня 2026  
**Коммит:** `5d94620`  
**Статус:** ✅ Код готов, ждет deployment  
**Следующий шаг:** Проверьте переменные окружения и пересоберите на production
