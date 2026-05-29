# Структура меню, комбо и мини-комбо

## 📋 Обзор системы

В системе Miss Kurochka есть три типа продуктов:

1. **Обычное меню** (regular) - отдельные блюда
2. **Мини-комбо** (mini_combo) - небольшие наборы, отображаются как обычные блюда
3. **Комбо-предложения** (combo) - большие выгодные наборы

## 🗂️ Структура базы данных

### 1. MenuCategory (Категории меню)

```prisma
model MenuCategory {
  id          String         @id @default(uuid())
  name        String
  type        CategoryType   @default(regular)  // regular | combo | mini_combo
  menuItems   MenuItem[]
  ...
}

enum CategoryType {
  regular      // Обычные категории (Бургеры, Курица, и т.д.)
  combo        // Категория для комбо (не используется для MenuItem)
  mini_combo   // Категория для мини-комбо (отображается как обычное меню)
}
```

### 2. MenuItem (Блюда)

```prisma
model MenuItem {
  id                 String
  categoryId         String
  name               String
  description        String?
  sizes              MenuItemSize[]
  modifiers          MenuItemModifier[]
  spices             MenuItemSpice[]
  images             MenuItemImage[]
  isActive           Boolean
  isFeatured         Boolean
  isNew              Boolean
  ...
}
```

**Мини-комбо** - это обычные MenuItem, но в категории с `type = mini_combo`.

### 3. ComboOffer (Комбо-предложения)

```prisma
model ComboOffer {
  id          String
  name        String
  description String?
  price       Decimal
  oldPrice    Decimal?
  imageUrl    String
  type        ComboType      @default(regular)  // regular | mini
  comboItems  ComboOfferItem[]
  ...
}

model ComboOfferItem {
  comboOfferId String
  menuItemId   String
  quantity     Int
  ...
}
```

## 🔄 Как работает система

### API Endpoints

#### 1. GET /api/menu
Возвращает все категории и блюда, сгруппированные по типам:

```json
{
  "categories": [...],
  "grouped": {
    "regular": [
      {
        "id": "cat-1",
        "name": "Бургеры",
        "type": "regular",
        "items": [...]
      }
    ],
    "mini_combo": [
      {
        "id": "cat-2",
        "name": "Мини-комбо",
        "type": "mini_combo",
        "items": [
          {
            "id": "item-1",
            "name": "Комбо Чикен",
            "sizes": [{ "price": 350 }],
            ...
          }
        ]
      }
    ],
    "combo": []  // Пусто, т.к. комбо хранятся отдельно
  }
}
```

#### 2. GET /api/combo-offers
Возвращает большие комбо-предложения:

```json
{
  "combos": [
    {
      "id": "combo-1",
      "name": "Семейное комбо",
      "price": 1200,
      "oldPrice": 1500,
      "items": ["Бургер", "Картофель фри", "Напиток"],
      "imageUrl": "..."
    }
  ]
}
```

## 📱 Отображение на фронтенде

### Главная страница (app/page.tsx)

#### Популярные блюда
```tsx
// Загружается из /api/menu/popular
// Показывает топ-6 блюд (включая мини-комбо)
<section id="popular">
  {popularItems.map(item => (
    <ProductCard item={item} />
  ))}
</section>
```

#### Комбо-карусель
```tsx
// Загружается из /api/combo-offers
// Показывает большие комбо-предложения
<section id="combo">
  {comboDeals.map(combo => (
    <ComboCard combo={combo} />
  ))}
</section>
```

### Страница меню (app/menu/page.tsx)

#### Desktop версия
```tsx
// Загружает все категории включая mini_combo
useEffect(() => {
  fetch('/api/menu')
    .then(r => r.json())
    .then(data => {
      const allCats = [
        ...(data.grouped.regular ?? []),
        ...(data.grouped.mini_combo ?? []),  // ✅ Мини-комбо включены
      ]
      setCategories(allCats)
    })
}, [])

// Отображение:
// Sidebar: Все категории (включая "Мини-комбо")
// Main: Карточки блюд (обычные + мини-комбо выглядят одинаково)
```

#### Mobile версия (components/mobile/MobileMenuScreen.tsx)
```tsx
// Аналогично desktop - загружает все типы
const allCats = [
  ...(grouped.regular ?? []),
  ...(grouped.mini_combo ?? []),
]
```

## ✅ Текущее состояние

### Что работает:

1. **✅ Обычное меню (regular)**
   - Отображается на главной странице (популярные)
   - Отображается в /menu (desktop + mobile)
   - Добавление в корзину работает
   - Модификаторы, размеры, специи работают

2. **✅ Мини-комбо (mini_combo)**
   - Хранятся как MenuItem в категории с type=mini_combo
   - Загружаются через /api/menu
   - Отображаются в /menu вместе с обычными блюдами
   - Добавление в корзину работает как обычное блюдо
   - Могут иметь размеры, модификаторы, специи

3. **✅ Комбо-предложения (combo)**
   - Хранятся в отдельной таблице ComboOffer
   - Загружаются через /api/combo-offers
   - Отображаются на главной странице в карусели
   - Добавление в корзину работает
   - Имеют фиксированную цену и состав

### Где отображаются:

| Тип | Главная страница | /menu Desktop | /menu Mobile | API |
|-----|-----------------|---------------|--------------|-----|
| **Regular** | ✅ Популярные | ✅ Все категории | ✅ Все категории | /api/menu |
| **Mini-combo** | ✅ Популярные | ✅ Отдельная категория | ✅ Отдельная категория | /api/menu |
| **Combo** | ✅ Карусель | ❌ Нет | ❌ Нет | /api/combo-offers |

## 🔧 Как добавить новые продукты

### Добавить обычное блюдо:
1. Админ-панель → Меню → Создать блюдо
2. Выбрать категорию с type=regular
3. Заполнить данные, добавить размеры/модификаторы
4. Блюдо появится в /menu

### Добавить мини-комбо:
1. Админ-панель → Категории → Создать категорию
2. Установить type=mini_combo, название "Мини-комбо"
3. Админ-панель → Меню → Создать блюдо
4. Выбрать созданную категорию мини-комбо
5. Блюдо появится в /menu в категории "Мини-комбо"

### Добавить большое комбо:
1. Админ-панель → Комбо-предложения → Создать
2. Выбрать блюда, которые входят в комбо
3. Установить цену и старую цену (для скидки)
4. Комбо появится на главной странице в карусели

## 🎯 Рекомендации

### Когда использовать мини-комбо:
- Небольшие наборы (2-3 позиции)
- Нужны опции (размеры, модификаторы)
- Должны отображаться в общем меню
- Пример: "Комбо Чикен" (бургер + картофель)

### Когда использовать большое комбо:
- Крупные наборы (4+ позиций)
- Фиксированный состав без опций
- Специальные предложения со скидкой
- Должны выделяться на главной странице
- Пример: "Семейное комбо" (2 бургера + 2 картофеля + 4 напитка)

## 📊 Схема работы корзины

### Добавление в корзину:

```typescript
// Обычное блюдо или мини-комбо
POST /api/cart
{
  menuItemId: "item-id",
  quantity: 1,
  sizeId: "size-id",      // опционально
  modifiers: ["mod-1"],   // опционально
  spices: ["spice-1"]     // опционально
}

// Большое комбо
POST /api/cart
{
  comboOfferId: "combo-id",
  quantity: 1
}
```

### Структура CartItem:

```prisma
model CartItem {
  id           String
  cartId       String
  menuItemId   String?      // Для обычных блюд и мини-комбо
  comboOfferId String?      // Для больших комбо
  quantity     Int
  sizeId       String?
  modifiers    String[]
  spices       String[]
  ...
}
```

## 🚀 Итог

**Мини-комбо** и **обычные блюда** работают идентично:
- ✅ Одна и та же модель (MenuItem)
- ✅ Одни и те же API endpoints
- ✅ Одинаковое добавление в корзину
- ✅ Поддержка размеров, модификаторов, специй
- ✅ Отображаются в /menu

**Большие комбо** работают отдельно:
- ✅ Отдельная модель (ComboOffer)
- ✅ Отдельный API endpoint
- ✅ Отображаются только на главной странице
- ✅ Фиксированный состав и цена

Все три типа полностью функциональны и работают корректно! 🎉
