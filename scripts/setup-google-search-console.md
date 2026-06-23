# Настройка Google Search Console для Miss Kurochka

## 🎯 Что было сделано для SEO

### 1. Созданы необходимые файлы

✅ **app/sitemap.ts** - Динамическая карта сайта
- Автоматически генерируется Next.js
- Доступна по адресу: `/sitemap.xml`
- Включает все основные страницы с приоритетами

✅ **app/robots.ts** - Правила для поисковых роботов
- Разрешает индексацию публичных страниц
- Блокирует админ-панель и API
- Указывает на sitemap.xml

✅ **app/opengraph-image.tsx** - Изображение для Open Graph
- Автоматически генерируется при сборке
- Используется Google, Facebook, Twitter, WhatsApp и т.д.
- Размер: 1200x630px

✅ **app/twitter-image.tsx** - Изображение для Twitter
- Оптимизировано для Twitter Cards
- Размер: 1200x600px

✅ **components/StructuredData.tsx** - JSON-LD структурированные данные
- Schema.org разметка для Google
- Тип: Restaurant, Organization, BreadcrumbList
- Помогает Google понять структуру сайта

✅ **Обновлен app/layout.tsx** - Улучшены метаданные
- Добавлен metadataBase
- Расширены keywords
- Добавлены Open Graph изображения
- Настроена верификация для Google и Yandex

### 2. Метаданные для SEO

```typescript
{
  title: "Мисс Курочка Бишкек | Доставка корейской хрустящей курочки",
  description: "Официальный сайт сети заведений Мисс Курочка в Бишкеке...",
  keywords: [
    "мисс курочка",
    "мисс курочка бишкек",
    "корейская курочка бишкек",
    "доставка еды бишкек",
    "хрустящая курочка",
    "янгнём",
    "кандян",
    // ... и другие
  ],
  openGraph: {
    images: ["/logo.png"],
    // ... полная конфигурация
  }
}
```

## 📋 Шаги для регистрации в Google Search Console

### Шаг 1: Регистрация домена

1. Перейдите на https://search.google.com/search-console/
2. Нажмите "Добавить ресурс"
3. Выберите **"Домен"** (рекомендуется) или **"Префикс URL"**
   - **Домен**: `miss-kurochka.com` (охватывает все поддомены)
   - **Префикс URL**: `https://miss-kurochka.com` (только этот URL)

### Шаг 2: Верификация (выберите один способ)

#### Вариант А: HTML-тег (РЕКОМЕНДУЕТСЯ)

Google даст вам мета-тег типа:
```html
<meta name="google-site-verification" content="ваш-код-верификации" />
```

**Добавьте код в .env:**
```env
NEXT_PUBLIC_GOOGLE_VERIFICATION="ваш-код-верификации"
```

**Замените в app/layout.tsx:**
```typescript
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  yandex: "0575424bed77977e",
}
```

#### Вариант Б: HTML-файл

1. Google даст файл `googleXXXXXX.html`
2. Скачайте файл
3. Положите в папку `public/`
4. Файл будет доступен по `https://miss-kurochka.com/googleXXXXXX.html`

#### Вариант В: DNS TXT-запись

1. Добавьте TXT-запись в DNS вашего домена
2. Значение: код от Google
3. Ожидайте обновления DNS (может занять до 48 часов)

### Шаг 3: Отправка sitemap.xml

После верификации:

1. В Google Search Console перейдите в **"Карты сайта"** (Sitemaps)
2. Введите: `sitemap.xml`
3. Нажмите **"Отправить"**

✅ Google начнёт индексировать ваш сайт

### Шаг 4: Проверка индексации

Через несколько дней проверьте:
1. **Покрытие** (Coverage) - какие страницы проиндексированы
2. **Эффективность** (Performance) - клики, показы, позиции
3. **Улучшения** (Enhancements) - проблемы с мобильной версией, скоростью и т.д.

## 🔍 Проверка текущего состояния

### Проверка robots.txt
```bash
curl https://miss-kurochka.com/robots.txt
```

Ожидаемый результат:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /branch/
Disallow: /api/
...

Sitemap: https://miss-kurochka.com/sitemap.xml
```

### Проверка sitemap.xml
```bash
curl https://miss-kurochka.com/sitemap.xml
```

Ожидаемый результат: XML с перечнем страниц

### Проверка структурированных данных

1. Откройте: https://validator.schema.org/
2. Введите: `https://miss-kurochka.com`
3. Нажмите **"RUN TEST"**
4. Проверьте, что нет ошибок в разметке Restaurant, Organization

### Проверка Open Graph

1. Откройте: https://www.opengraph.xyz/
2. Введите: `https://miss-kurochka.com`
3. Проверьте отображение логотипа и описания

## 📊 Ускорение индексации

### 1. Запросите индексацию вручную

В Google Search Console:
1. Введите URL в поисковую строку вверху
2. Нажмите **"Запросить индексирование"** (Request Indexing)
3. Повторите для важных страниц:
   - `https://miss-kurochka.com`
   - `https://miss-kurochka.com/menu`
   - `https://miss-kurochka.com/branches`

### 2. Создайте внешние ссылки

- Разместите ссылку на сайт в соцсетях
- Добавьте сайт в бизнес-каталоги:
  - Google My Business
  - 2GIS
  - Yell.kg
  - Somon.kg
  - И другие кыргызские каталоги

### 3. Добавьте сайт в Google My Business

1. https://business.google.com/
2. Добавьте все филиалы
3. Укажите ссылку на сайт
4. Добавьте фото, меню, часы работы

## 🚀 Дополнительные улучшения

### Добавьте реальный номер телефона

В `components/StructuredData.tsx` замените:
```typescript
telephone: '+996-XXX-XXX-XXX'
```

На реальный номер:
```typescript
telephone: '+996-555-123-456' // ваш номер
```

### Добавьте конкретные адреса филиалов

В `components/StructuredData.tsx` обновите:
```typescript
address: {
  '@type': 'PostalAddress',
  streetAddress: 'ул. Ленина, 123', // реальный адрес
  addressLocality: 'Бишкек',
  ...
}
```

### Добавьте ссылки на соцсети

В `components/StructuredData.tsx`:
```typescript
sameAs: [
  'https://www.instagram.com/miss_kurochka_kg',
  'https://www.facebook.com/misskurochka',
  'https://t.me/miss_kurochka',
],
```

### Настройте Google Analytics (опционально)

1. Создайте аккаунт на https://analytics.google.com/
2. Получите код отслеживания
3. Добавьте в `app/layout.tsx`:

```typescript
<head>
  <script
    async
    src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
  />
  <script
    dangerouslySetInnerHTML={{
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
      `,
    }}
  />
</head>
```

## 🐛 Решение проблем

### Логотип не отображается

**Проблема:** Google не видит логотип

**Решение:**
1. Убедитесь, что `public/logo.png` существует
2. Проверьте размер: рекомендуется 500x500px
3. Убедитесь, что файл доступен: `https://miss-kurochka.com/logo.png`
4. Подождите несколько дней для переиндексации

### Сайт не индексируется

**Возможные причины:**
1. Не прошла верификация в Google Search Console
2. Файл robots.txt блокирует индексацию
3. Метатег `noindex` на страницах
4. Сайт новый (нужно время)

**Решение:**
1. Проверьте статус в Google Search Console → Coverage
2. Проверьте `robots.txt` и убедитесь, что нет `Disallow: /`
3. Проверьте метаданные в `app/layout.tsx`: `robots: { index: true }`
4. Подождите 1-2 недели

### Устаревшее описание в Google

**Проблема:** Google показывает старое описание

**Решение:**
1. Обновите метаданные в `app/layout.tsx`
2. Запросите повторную индексацию в Google Search Console
3. Подождите несколько дней

## ✅ Чеклист

- [ ] Сайт задеплоен на продакшн
- [ ] Добавлен домен в Google Search Console
- [ ] Пройдена верификация
- [ ] Отправлена sitemap.xml
- [ ] Проверены robots.txt и sitemap.xml
- [ ] Добавлен реальный номер телефона в структурированные данные
- [ ] Добавлены конкретные адреса филиалов
- [ ] Добавлены ссылки на соцсети
- [ ] Запрошена индексация главных страниц
- [ ] Создан Google My Business для филиалов
- [ ] Добавлены внешние ссылки (соцсети, каталоги)
- [ ] Проверка через 1-2 недели

## 📞 Поддержка

Если возникли вопросы:
1. Проверьте документацию Google: https://support.google.com/webmasters/
2. Используйте инструменты проверки выше
3. Проверьте логи в Google Search Console

Удачи с индексацией! 🚀
