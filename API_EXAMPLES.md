# 📡 API Examples - Miss Kurochka

## 🏢 Филиалы

### Получить все филиалы
```bash
GET /api/branches
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Miss Kurochka - Центр",
      "address": "ул. Чуй 123, Бишкек",
      "phone": "+996555123456",
      "city": "Bishkek",
      "latitude": "42.87460000",
      "longitude": "74.56980000",
      "status": "active",
      "schedules": [
        {
          "dayOfWeek": 0,
          "openTime": "09:00:00",
          "closeTime": "22:00:00"
        }
      ],
      "deliveryZones": [...]
    }
  ]
}
```

## 🍔 Меню

### Получить меню
```bash
GET /api/menu
GET /api/menu?branchId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Курица",
      "nameI18n": {
        "ru": "Курица",
        "en": "Chicken",
        "ky": "Тоок"
      },
      "menuItems": [
        {
          "id": "uuid",
          "name": "Куриные крылышки",
          "price": "350.00",
          "weightGrams": 250,
          "cookingTimeMinutes": 15,
          "images": [
            {
              "imageUrl": "/images/wings.jpg",
              "isPrimary": true
            }
          ],
          "modifiers": [
            {
              "modifierGroup": {
                "id": "uuid",
                "name": "Выбор соуса",
                "selectionType": "single",
                "isRequired": true,
                "options": [
                  {
                    "id": "uuid",
                    "name": "Кетчуп",
                    "priceDelta": "0.00",
                    "isDefault": true
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 🧾 Заказы

### Создать заказ
```bash
POST /api/orders
Content-Type: application/json
```

**Request Body:**
```json
{
  "branchId": "uuid",
  "customerId": "uuid",
  "customerName": "Иван Иванов",
  "customerPhone": "+996555123456",
  "customerComment": "Позвоните за 5 минут",
  "orderType": "delivery",
  "paymentMethod": "finik",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "comment": "Без лука",
      "modifiers": [
        {
          "modifierOptionId": "uuid"
        }
      ]
    },
    {
      "menuItemId": "uuid",
      "quantity": 1,
      "modifiers": []
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-1714000000000",
    "status": "pending",
    "totalAmount": "850.00",
    "items": [
      {
        "menuItem": {
          "name": "Куриные крылышки"
        },
        "quantity": 2,
        "unitPrice": "350.00",
        "totalPrice": "720.00",
        "modifiers": [
          {
            "modifierOption": {
              "name": "Острый"
            },
            "priceDelta": "10.00"
          }
        ]
      }
    ],
    "payments": [
      {
        "paymentMethod": "finik",
        "amount": "850.00",
        "status": "pending"
      }
    ]
  }
}
```

### Получить заказы
```bash
GET /api/orders
GET /api/orders?customerId=uuid
GET /api/orders?branchId=uuid
GET /api/orders?status=pending
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-1714000000000",
      "customerName": "Иван Иванов",
      "customerPhone": "+996555123456",
      "status": "pending",
      "totalAmount": "850.00",
      "createdAt": "2026-04-24T10:30:00Z",
      "branch": {
        "name": "Miss Kurochka - Центр"
      },
      "items": [...],
      "payments": [...]
    }
  ]
}
```

## 🔧 Примеры использования в коде

### Fetch API (клиент)
```typescript
// Получить меню
const response = await fetch('/api/menu?branchId=uuid')
const { data: categories } = await response.json()

// Создать заказ
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    branchId: 'uuid',
    customerName: 'Иван Иванов',
    customerPhone: '+996555123456',
    orderType: 'delivery',
    paymentMethod: 'finik',
    items: [
      {
        menuItemId: 'uuid',
        quantity: 2,
        modifiers: [
          { modifierOptionId: 'uuid' }
        ]
      }
    ]
  })
})
const { data: order } = await response.json()
```

### Server Component (Next.js)
```typescript
import { prisma } from '@/lib/prisma'

export default async function MenuPage() {
  const categories = await prisma.menuCategory.findMany({
    where: { status: 'active' },
    include: {
      menuItems: {
        where: { isActive: true },
        include: {
          images: true,
          modifiers: {
            include: {
              modifierGroup: {
                include: { options: true }
              }
            }
          }
        }
      }
    }
  })

  return (
    <div>
      {categories.map(category => (
        <div key={category.id}>
          <h2>{category.name}</h2>
          {category.menuItems.map(item => (
            <div key={item.id}>
              <h3>{item.name}</h3>
              <p>{item.price} сом</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

### Server Action (Next.js)
```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createOrder(formData: FormData) {
  const orderData = {
    branchId: formData.get('branchId') as string,
    customerName: formData.get('customerName') as string,
    customerPhone: formData.get('customerPhone') as string,
    orderType: 'pickup',
    paymentMethod: 'cash',
    totalAmount: 350,
  }

  const order = await prisma.order.create({
    data: {
      ...orderData,
      orderNumber: `ORD-${Date.now()}`,
      status: 'pending',
      items: {
        create: [
          {
            menuItemId: formData.get('menuItemId') as string,
            quantity: 1,
            unitPrice: 350,
            totalPrice: 350,
          }
        ]
      },
      payments: {
        create: {
          paymentMethod: 'cash',
          amount: 350,
          currency: 'KGS',
          status: 'pending',
        }
      }
    }
  })

  revalidatePath('/orders')
  return order
}
```

## 📊 Типы данных

### OrderType
- `pickup` - Самовывоз
- `delivery` - Доставка

### OrderStatus
- `pending` - Ожидает подтверждения
- `confirmed` - Подтвержден
- `preparing` - Готовится
- `ready` - Готов
- `delivering` - Доставляется
- `completed` - Завершен
- `cancelled` - Отменен

### PaymentMethod
- `cash` - Наличные
- `card` - Карта
- `finik` - Finik
- `online` - Онлайн оплата

### PaymentStatus
- `pending` - Ожидает оплаты
- `processing` - Обрабатывается
- `completed` - Оплачен
- `failed` - Ошибка
- `refunded` - Возврат

### SelectionType (модификаторы)
- `single` - Выбор одного варианта
- `multiple` - Выбор нескольких вариантов
