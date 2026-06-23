# Miss Kurochka - Система управления рестораном

Полнофункциональная платформа для управления рестораном быстрого питания с веб-интерфейсом, админ-панелью и ИИ-помощником.

## 🤖 ИИ-Помощник с доступом к базе данных

### Возможности

ИИ-помощник имеет прямой доступ к базе данных и может:

1. **Информация о меню**
   - Показывать актуальные цены всех блюд
   - Предоставлять информацию о составе и ингредиентах
   - Рассказывать о доступных размерах порций
   - Информировать о модификаторах (добавках) и их стоимости

2. **Персонализированные рекомендации**
   - Подбирать блюда по бюджету клиента
   - Фильтровать по категориям (бургеры, курица, напитки и т.д.)
   - Находить вегетарианские и веганские опции
   - Учитывать уровень остроты блюд

3. **Комбо-предложения и акции**
   - Показывать актуальные комбо-наборы
   - Сравнивать цены комбо с отдельными блюдами
   - Информировать о скидках и специальных предложениях

4. **Дополнительные предложения**
   - Рекомендовать соусы, напитки, десерты
   - Показывать цены на дополнения

5. **Информация о филиалах**
   - Предоставлять адреса и контакты всех филиалов
   - Информировать о минимальной сумме заказа
   - Сообщать среднее время приготовления

### Технические детали

#### API Endpoint
```
POST /api/ai/chat
```

#### Формат запроса
```json
{
  "messages": [
    { "role": "user", "content": "Какие у вас есть бургеры до 300 сом?" }
  ]
}
```

#### Формат ответа
```json
{
  "reply": "У нас есть несколько бургеров до 300 сом: Чикен Бургер (250 сом), Классический Бургер (280 сом)..."
}
```

#### Доступные функции (Function Calling)

1. **get_menu_items** - Получение блюд из меню
   - Параметры: `category`, `isVegetarian`, `maxPrice`
   - Возвращает: список блюд с ценами, размерами, составом, модификаторами

2. **get_combo_offers** - Получение комбо-наборов
   - Возвращает: список комбо с составом и ценами

3. **get_additional_offers** - Получение дополнительных предложений
   - Параметры: `category` (опционально)
   - Возвращает: соусы, напитки, десерты

4. **get_branches** - Получение информации о филиалах
   - Возвращает: адреса, телефоны, минимальные суммы заказа

### Примеры использования

**Клиент:** "Сколько стоит Чикен Бургер?"
**ИИ:** *Вызывает get_menu_items с фильтром по категории "бургер"*
**ИИ:** "Чикен Бургер доступен в двух размерах: стандартный - 250 сом, большой - 320 сом. В состав входит..."

**Клиент:** "Что можете посоветовать вегетарианское до 200 сом?"
**ИИ:** *Вызывает get_menu_items с фильтрами isVegetarian=true, maxPrice=200*
**ИИ:** "Рекомендую Овощной салат (150 сом) или Картофель фри (120 сом)..."

**Клиент:** "Какие у вас есть комбо?"
**ИИ:** *Вызывает get_combo_offers*
**ИИ:** "У нас есть несколько выгодных комбо: Комбо №1 (бургер + картофель + напиток) - 450 сом вместо 520 сом..."

### Настройка

1. Убедитесь, что в `.env` указан ключ OpenAI:
```env
OPEN_AI=your-openai-api-key
```

2. База данных должна быть настроена и содержать данные:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/miss_kurochka
```

3. Запустите миграции Prisma:
```bash
npx prisma migrate dev
```

### Архитектура

```
Клиент → POST /api/ai/chat
         ↓
    OpenAI GPT-4o-mini (с function calling)
         ↓
    Вызов функций → Prisma → PostgreSQL
         ↓
    Формирование ответа с реальными данными
         ↓
    Ответ клиенту
```

### Преимущества

✅ **Актуальные данные** - ИИ всегда использует текущие цены и наличие из БД
✅ **Точность** - Нет выдуманной информации, только реальные данные
✅ **Персонализация** - Рекомендации на основе предпочтений клиента
✅ **Масштабируемость** - Легко добавить новые функции и источники данных
✅ **Многоязычность** - Поддержка русского и кыргызского языков

## 🔐 Аутентификация

- Регистрация и вход через email/пароль
- OAuth через Google
- Восстановление пароля
- Двухфакторная аутентификация для админов
- **Автоматическая очистка корзины при выходе** - при выходе пользователя из системы корзина автоматически очищается

## 🔍 SEO и индексация в Google

### 🎯 Аудит Favicon / Logo Indexing

**23 июня 2026** — Проведён полный аудит favicon и logo indexing для Google Search.

**Проблема:** Google Search не показывает favicon сайта.

**Найденные проблемы:**
- ❌ `/site.webmanifest` возвращает 404 (исправлено ✅)
- ❌ `favicon.ico` слишком большой — 87.56 KB вместо <10KB
- ❌ Вероятно имеет белый фон и padding
- ❌ Избыточное версионирование `?v=4` (исправлено ✅)

**Что исправлено автоматически:**
- ✅ Добавлен redirect `/site.webmanifest` → `/manifest.webmanifest`
- ✅ Убрано версионирование из favicon URL
- ✅ Обновлены metadata и манифест
- ✅ Добавлены правильные headers

**Что нужно сделать вручную:**
1. Создать оптимизированный favicon (transparent, круглый, <10KB)
2. Commit и deploy изменения
3. Запросить переиндексацию в Google Search Console

**📖 Начните здесь:** [НАЧНИТЕ_ОТСЮДА.md](./НАЧНИТЕ_ОТСЮДА.md)

**📊 Документация:**
- [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) - Краткая сводка
- [FAVICON_AUDIT_REPORT.md](./FAVICON_AUDIT_REPORT.md) - Полный отчет
- [FAVICON_FIX_INSTRUCTIONS.md](./FAVICON_FIX_INSTRUCTIONS.md) - Инструкции
- [COMMIT_CHANGES.md](./COMMIT_CHANGES.md) - Git команды

**⏱️ Время:** 30-40 минут | **📈 Успех:** 85-95%

---

### Реализованные функции SEO

✅ **Автоматическая карта сайта** (`/sitemap.xml`)
- Динамически генерируется Next.js
- Включает все публичные страницы с приоритетами
- Автоматически обновляется при добавлении новых страниц

✅ **Правила для поисковых роботов** (`/robots.txt`)
- Разрешает индексацию публичных страниц
- Блокирует админ-панель, филиал-панель и API
- Указывает на sitemap.xml

✅ **Open Graph изображения**
- Автоматическая генерация превью для соцсетей
- Отображается в Google, Facebook, Twitter, WhatsApp
- Размер: 1200x630px (Open Graph), 1200x600px (Twitter)

✅ **Структурированные данные (JSON-LD)**
- Schema.org разметка типа Restaurant, Organization
- Помогает Google правильно понять структуру сайта
- Улучшает отображение в результатах поиска

✅ **Оптимизированные метаданные**
- SEO-оптимизированные title, description, keywords
- Поддержка русского и кыргызского языков
- Корректные метатеги для соцсетей

### Настройка Google Search Console

**Подробная инструкция:** См. [scripts/setup-google-search-console.md](./scripts/setup-google-search-console.md)

**Краткая инструкция:**

1. **Зарегистрируйтесь в Google Search Console**
   - Перейдите: https://search.google.com/search-console/
   - Добавьте ваш домен
   - Пройдите верификацию

2. **Добавьте код верификации в .env:**
   ```env
   NEXT_PUBLIC_GOOGLE_VERIFICATION="ваш-код-от-google"
   ```

3. **Отправьте sitemap.xml**
   - В Google Search Console → "Карты сайта"
   - Введите: `sitemap.xml`
   - Нажмите "Отправить"

4. **Обновите контактные данные**
   - В `components/StructuredData.tsx` замените:
     - `telephone` на реальный номер
     - `streetAddress` на реальный адрес
     - `sameAs` на ссылки на соцсети

**Сроки индексации:**
- Первое сканирование: 1-3 дня
- Полная индексация: 1-2 недели
- Отображение в результатах: 2-4 недели

**Проверка работы:**
- `https://ваш-домен.com/robots.txt` - правила для роботов
- `https://ваш-домен.com/sitemap.xml` - карта сайта
- https://www.opengraph.xyz/ - проверка Open Graph
- https://validator.schema.org/ - проверка структурированных данных

**Резюме изменений:** См. [SEO_SUMMARY.md](./SEO_SUMMARY.md)

### Управление корзиной

#### Автоматическая очистка корзины

При выходе пользователя из системы (logout), корзина автоматически очищается на сервере. Это реализовано через функцию `signOutWithCartCleanup` в `lib/cart-utils.ts`.

**Как это работает:**
1. Пользователь нажимает "Выйти"
2. Автоматически вызывается API `DELETE /api/cart` для очистки корзины
3. После успешной очистки выполняется выход из аккаунта
4. При следующем входе пользователь видит пустую корзину

**Технические детали:**
```typescript
// lib/cart-utils.ts
export async function signOutWithCartCleanup(signOut: any, callbackUrl = '/'): Promise<void> {
  // Сначала очищаем корзину
  await clearUserCart();
  
  // Затем выходим
  await signOut({ callbackUrl });
}
```

**Где используется:**
- Главная страница (`/home`)
- Профиль пользователя (`/profile`)
- Мобильное меню
- Десктоп меню
- Все клиентские компоненты с функцией выхода

**API Endpoint:**
```
DELETE /api/cart
```

Возвращает: `{ success: true }` при успешной очистке корзины.

## 📦 Технологии

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **AI:** OpenAI GPT-4o-mini с Function Calling
- **Auth:** NextAuth.js

## 🚀 Запуск проекта

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Настройка БД
npx prisma migrate dev

# Запуск dev-сервера
npm run dev
```

### 🐳 Деплой на Timeweb App Platform

Проект готов к деплою на Timeweb App Platform с использованием Docker.

**Быстрый старт:**
1. Создайте PostgreSQL базу данных (в Timeweb Cloud или внешний сервис)
2. Загрузите код в GitHub/GitLab/Bitbucket
3. Создайте приложение в Timeweb App Platform
4. Настройте переменные окружения
5. Деплой произойдет автоматически!

**📖 Подробная инструкция:** См. [TIMEWEB_DEPLOY.md](./TIMEWEB_DEPLOY.md)

**Что включено:**
- ✅ Оптимизированный Dockerfile для production
- ✅ Multi-stage сборка для минимального размера образа
- ✅ Автоматическая генерация Prisma Client
- ✅ Поддержка внешней PostgreSQL базы данных
- ✅ Готовность к автодеплою при git push

## 💳 Настройка Finik Pay

### Проблема с подписью платежей

Если вы видите ошибку `Failed to generate Finik signature`, это означает, что приватный ключ в `.env` файле настроен неправильно.

### Быстрое решение:

```bash
# 1. Запустите скрипт проверки
npx tsx scripts/test-finik-key.ts

# 2. Скопируйте содержимое созданного файла finik_key_for_env.txt в .env

# 3. Перезапустите сервер
npm run dev
```

Подробная инструкция: см. [FINIK_KEY_SETUP.md](./FINIK_KEY_SETUP.md)

### Тестирование с localhost

⚠️ **Важно:** Finik API не может отправлять webhooks на `localhost`. Для тестирования используйте:

1. **ngrok** (рекомендуется):
```bash
ngrok http 3000
# Обновите NEXT_PUBLIC_APP_URL в .env на ngrok URL
```

2. **Beta окружение** (без webhook):
```env
FINIK_ENV="beta"
```

Подробнее: [FINIK_TESTING_GUIDE.md](./FINIK_TESTING_GUIDE.md)

### Переменные окружения для Finik:

```env
FINIK_ENV="prod"                    # или "beta" для тестирования
FINIK_ACCOUNT_ID="ваш-account-id"
FINIK_API_KEY="ваш-api-key"
FINIK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...ваш_ключ...\n-----END PRIVATE KEY-----"

# Для тестирования с ngrok:
NEXT_PUBLIC_APP_URL="https://your-ngrok-url.ngrok.io"
NEXTAUTH_URL="https://your-ngrok-url.ngrok.io"
```

**Важно:** Приватный ключ должен быть в одну строку с `\n` вместо реальных переносов строк.

## 🎨 Компоненты загрузки

### Доступные компоненты

#### 1. Spinner - Базовый спиннер
```tsx
import Spinner from '@/components/Spinner'

// Разные размеры
<Spinner size="sm" />  // Маленький (16px)
<Spinner size="md" />  // Средний (32px) - по умолчанию
<Spinner size="lg" />  // Большой (48px)
<Spinner size="xl" />  // Очень большой (64px)

// С кастомными классами
<Spinner size="lg" className="text-blue-500" />
```

#### 2. LoadingScreen - Полноэкранная загрузка
```tsx
import LoadingScreen from '@/components/LoadingScreen'

// Полноэкранная загрузка
<LoadingScreen message="Загрузка данных..." />

// Загрузка в контейнере
<LoadingScreen message="Обработка..." fullScreen={false} />
```

#### 3. LoadingCard - Загрузка в карточке
```tsx
import LoadingCard from '@/components/LoadingCard'

// Стандартная высота
<LoadingCard message="Загрузка меню..." />

// Кастомная высота
<LoadingCard message="Загрузка..." height="h-96" />
```

#### 4. ButtonWithLoading - Кнопка с индикатором загрузки
```tsx
import ButtonWithLoading from '@/components/ButtonWithLoading'

<ButtonWithLoading
  loading={isLoading}
  onClick={handleSubmit}
  variant="primary"
  size="lg"
>
  Отправить заказ
</ButtonWithLoading>

// Варианты: primary, secondary, ghost
// Размеры: sm, md, lg
```

### Примеры использования

#### Загрузка данных в странице
```tsx
'use client'

import { useState, useEffect } from 'react'
import LoadingScreen from '@/components/LoadingScreen'

export default function MenuPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchData().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <LoadingScreen message="Загрузка меню..." />
  }

  return <div>{/* Контент */}</div>
}
```

#### Кнопка с загрузкой
```tsx
'use client'

import { useState } from 'react'
import ButtonWithLoading from '@/components/ButtonWithLoading'

export default function OrderForm() {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await submitOrder()
    setSubmitting(false)
  }

  return (
    <ButtonWithLoading
      loading={submitting}
      onClick={handleSubmit}
      variant="primary"
    >
      Оформить заказ
    </ButtonWithLoading>
  )
}
```

#### Загрузка в списке карточек
```tsx
import LoadingCard from '@/components/LoadingCard'

export default function MenuList({ loading, items }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LoadingCard message="Загрузка блюд..." />
        <LoadingCard message="Загрузка блюд..." />
        <LoadingCard message="Загрузка блюд..." />
      </div>
    )
  }

  return <div>{/* Список блюд */}</div>
}
```

### Стилизация

Все спиннеры используют цвет бренда `var(--brand)` (#d62300) и автоматически адаптируются к дизайн-системе проекта. Анимация вращения настроена через Tailwind CSS класс `animate-spin`.

## 📝 Лицензия

Proprietary - Miss Kurochka Restaurant

## 📱 PWA и иконки мобильного приложения

### Исправление отображения иконок

Проект настроен как Progressive Web App (PWA) и может быть установлен на главный экран мобильного устройства.

**✅ Все иконки оптимизированы с правильным padding:**
- iOS (Safari) - используется `apple-icon.png` (180×180px, padding 15%)
- Android (Chrome) - используется `icon-512.png` (512×512px, padding 15%)
- Android Adaptive - используется `icon-maskable-512.png` (512×512px, padding 20%)

### Тестирование иконок

Откройте в браузере: **http://localhost:3000/test-icons.html**

Эта страница показывает все иконки с описаниями и позволяет визуально проверить правильность отображения.

### Установка PWA на телефон

#### Android (Chrome):
1. Откройте сайт в Chrome
2. Меню (⋮) → "Добавить на главный экран"
3. Согласитесь на установку

#### iOS (Safari):
1. Откройте сайт в Safari
2. Нажмите кнопку "Поделиться" (📤)
3. "Добавить на экран «Домой»"

### Обновление логотипа

Если нужно обновить логотип в будущем:

```bash
# 1. Замените файл public/logo.png на новый (500×500px, круглый)
# 2. Запустите скрипт генерации иконок:
node scripts/fix-pwa-icons.js
```

Скрипт автоматически создаст все необходимые иконки с правильным padding.

**Подробная документация:**
- [Инструкция по PWA иконкам](./scripts/README-PWA-ICONS.md)
- [Чеклист деплоя](./DEPLOYMENT-CHECKLIST-PWA.md)
- [Краткая сводка изменений](./ICON-FIX-SUMMARY.md)
