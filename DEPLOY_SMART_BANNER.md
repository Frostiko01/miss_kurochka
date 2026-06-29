# 🚀 Деплой Smart Hero Banner

## Быстрый старт

Smart Hero Banner готов к деплою! Все изменения локальны и не требуют миграций базы данных.

## Что было изменено

### Новые файлы
1. `app/api/smart-banner/route.ts` - API для получения баннеров
2. `components/SmartHeroBanner.tsx` - компонент баннера
3. `app/admin/smart-banner/page.tsx` - админ-панель настроек

### Измененные файлы
1. `app/home/page.tsx` - заменена карточка пользователя на баннер
2. `components/admin/AdminSidebar.tsx` - добавлен пункт меню

## Шаги деплоя

### 1. Проверка перед деплоем

```bash
# Убедитесь что все файлы на месте
ls app/api/smart-banner/route.ts
ls components/SmartHeroBanner.tsx
ls app/admin/smart-banner/page.tsx

# Проверьте компиляцию
npm run build
```

### 2. Деплой на сервер

```bash
# Стандартный процесс деплоя
git add .
git commit -m "feat: Add Smart Hero Banner"
git push origin main

# Или через ваш CI/CD pipeline
```

### 3. После деплоя

#### Проверьте работу баннера
1. Откройте `/home` (требуется авторизация)
2. Убедитесь что баннер отображается вместо карточки пользователя
3. Проверьте автоматическую смену баннеров (каждые 5 сек)
4. Кликните на баннер - должна открыться модалка товара

#### Настройте через админку
1. Перейдите в `/admin/smart-banner`
2. Проверьте что настройки загружаются
3. Настройте по желанию:
   - Время автопрокрутки
   - Количество баннеров
   - Фильтры отображения
4. Нажмите "Сохранить настройки"
5. Проверьте "Превью баннеров"

## Возможные проблемы

### Баннер не отображается
**Причина**: Нет товаров в базе или все неактивны  
**Решение**: 
- Проверьте что в базе есть активные товары (`isActive = true`)
- Добавьте флаг `isFeatured = true` или `isNew = true` для некоторых товаров
- Убедитесь что у товаров есть изображения

### API возвращает пустой массив
**Причина**: Нет статистики заказов  
**Решение**:
- Это нормально для новой установки
- API автоматически вернет случайные активные товары
- После первых заказов статистика начнет собираться

### Изображения не загружаются
**Причина**: Неправильные URL изображений в базе  
**Решение**:
- Проверьте таблицу `MenuItemImage`
- Убедитесь что `imageUrl` содержит корректные ссылки
- Для комбо проверьте `ComboOffer.imageUrl`

### Настройки не сохраняются
**Причина**: Нет доступа к API настроек  
**Решение**:
- Проверьте что пользователь имеет роль `admin`
- Убедитесь что API `/api/admin/settings` работает
- Проверьте права доступа к таблице `SystemSetting`

## Мониторинг

### Что проверять

1. **Производительность API**
```bash
# Проверьте время ответа
curl -w "@curl-format.txt" https://your-domain.com/api/smart-banner
```

2. **Логи ошибок**
```bash
# Проверьте логи сервера
pm2 logs
# или
docker logs your-container
```

3. **База данных**
```sql
-- Проверьте статистику заказов
SELECT COUNT(*) FROM "popular_items_stats";

-- Проверьте активные товары
SELECT COUNT(*) FROM "menu_items" WHERE "is_active" = true;

-- Проверьте изображения
SELECT COUNT(*) FROM "menu_item_images" WHERE "is_primary" = true;
```

## Оптимизация после деплоя

### Добавить кэширование (опционально)

Если API `/api/smart-banner` медленный, добавьте кэш:

```typescript
// app/api/smart-banner/route.ts
import { unstable_cache } from 'next/cache';

const getCachedBanners = unstable_cache(
  async () => {
    // ... существующий код
  },
  ['smart-banners'],
  { revalidate: 600 } // 10 минут
);

export async function GET() {
  const banners = await getCachedBanners();
  return NextResponse.json({ banners, success: true });
}
```

### Добавить индексы БД (если нужно)

```sql
-- Индекс для быстрого поиска статистики
CREATE INDEX IF NOT EXISTS idx_popular_stats_date 
ON "popular_items_stats" ("date" DESC, "order_count" DESC);

-- Индекс для активных товаров
CREATE INDEX IF NOT EXISTS idx_menu_items_active 
ON "menu_items" ("is_active", "is_featured", "is_new");
```

## Откат изменений (если нужно)

### Вернуть старую карточку пользователя

```bash
# Откатите изменения в app/home/page.tsx
git checkout HEAD~1 -- app/home/page.tsx

# Удалите новые файлы
rm app/api/smart-banner/route.ts
rm components/SmartHeroBanner.tsx
rm app/admin/smart-banner/page.tsx

# Откатите изменения в сайдбаре
git checkout HEAD~1 -- components/admin/AdminSidebar.tsx

# Задеплойте
git commit -m "revert: Rollback Smart Hero Banner"
git push origin main
```

## Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Проверьте логи базы данных
3. Проверьте браузерную консоль (F12)
4. Прочитайте `SMART_BANNER_IMPLEMENTATION.md`

## Чеклист после деплоя

- [ ] Баннер отображается на `/home`
- [ ] Баннеры автоматически меняются
- [ ] Клик по баннеру открывает товар
- [ ] Админ-панель доступна на `/admin/smart-banner`
- [ ] Настройки сохраняются
- [ ] Превью баннеров работает
- [ ] Изображения загружаются
- [ ] API отвечает быстро (< 500ms)
- [ ] Нет ошибок в логах
- [ ] Мобильная версия работает

## Готово! 🎉

Smart Hero Banner успешно задеплоен и работает!
