// Типы для работы с API Miss Kurochka

import { Prisma } from '@prisma/client'

// ============================================
// Типы с включенными связями
// ============================================

export type MenuCategoryWithItems = Prisma.MenuCategoryGetPayload<{
  include: {
    menuItems: {
      include: {
        images: true
        modifiers: {
          include: {
            modifierGroup: {
              include: {
                options: true
              }
            }
          }
        }
      }
    }
  }
}>

export type MenuItemWithDetails = Prisma.MenuItemGetPayload<{
  include: {
    images: true
    modifiers: {
      include: {
        modifierGroup: {
          include: {
            options: true
          }
        }
      }
    }
    category: true
  }
}>

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        menuItem: {
          include: {
            images: true
          }
        }
        modifiers: {
          include: {
            modifierOption: true
          }
        }
      }
    }
    payments: true
    branch: true
    customer: true
  }
}>

export type BranchWithSchedule = Prisma.BranchGetPayload<{
  include: {
    schedules: true
    deliveryZones: true
  }
}>

// ============================================
// API Request/Response типы
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface CreateOrderRequest {
  branchId: string
  customerId?: string
  customerName: string
  customerPhone: string
  customerComment?: string
  orderType: 'pickup' | 'delivery'
  paymentMethod: 'cash' | 'card' | 'finik' | 'online'
  items: OrderItemInput[]
}

export interface OrderItemInput {
  menuItemId: string
  quantity: number
  comment?: string
  modifiers?: ModifierInput[]
}

export interface ModifierInput {
  modifierOptionId: string
}

// ============================================
// Мультиязычность
// ============================================

export type Language = 'ru' | 'en' | 'ky'

export interface I18nText {
  ru: string
  en: string
  ky: string
}

// ============================================
// Утилиты для работы с i18n
// ============================================

export function getI18nText(
  i18nField: I18nText | null | undefined,
  fallback: string,
  lang: Language = 'ru'
): string {
  if (!i18nField) return fallback
  return i18nField[lang] || i18nField.ru || fallback
}

// ============================================
// Форматирование
// ============================================

export function formatPrice(price: number | string | Prisma.Decimal, currency: string = 'сом'): string {
  let numPrice: number
  
  if (typeof price === 'string') {
    numPrice = parseFloat(price)
  } else if (typeof price === 'number') {
    numPrice = price
  } else {
    // Prisma.Decimal
    numPrice = price.toNumber()
  }
  
  return `${numPrice.toFixed(0)} ${currency}`
}

export function formatPhone(phone: string): string {
  // +996555123456 -> +996 555 12-34-56
  if (phone.startsWith('+996')) {
    return phone.replace(/(\+996)(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3-$4-$5')
  }
  return phone
}

// ============================================
// Валидация
// ============================================

export function isValidPhone(phone: string): boolean {
  // Кыргызстан: +996XXXXXXXXX
  return /^\+996\d{9}$/.test(phone)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ============================================
// Константы
// ============================================

export const ORDER_STATUS_LABELS: Record<string, I18nText> = {
  pending: {
    ru: 'Ожидает подтверждения',
    en: 'Pending',
    ky: 'Ырастоону күтүүдө'
  },
  confirmed: {
    ru: 'Подтвержден',
    en: 'Confirmed',
    ky: 'Ырасталды'
  },
  preparing: {
    ru: 'Готовится',
    en: 'Preparing',
    ky: 'Даярдалууда'
  },
  ready: {
    ru: 'Готов',
    en: 'Ready',
    ky: 'Даяр'
  },
  delivering: {
    ru: 'Доставляется',
    en: 'Delivering',
    ky: 'Жеткирилүүдө'
  },
  completed: {
    ru: 'Завершен',
    en: 'Completed',
    ky: 'Аяктады'
  },
  cancelled: {
    ru: 'Отменен',
    en: 'Cancelled',
    ky: 'Жокко чыгарылды'
  }
}

export const PAYMENT_METHOD_LABELS: Record<string, I18nText> = {
  cash: {
    ru: 'Наличные',
    en: 'Cash',
    ky: 'Накталай'
  },
  card: {
    ru: 'Карта',
    en: 'Card',
    ky: 'Карта'
  },
  finik: {
    ru: 'Finik',
    en: 'Finik',
    ky: 'Finik'
  },
  online: {
    ru: 'Онлайн',
    en: 'Online',
    ky: 'Онлайн'
  }
}

export const DAYS_OF_WEEK: I18nText[] = [
  { ru: 'Понедельник', en: 'Monday', ky: 'Дүйшөмбү' },
  { ru: 'Вторник', en: 'Tuesday', ky: 'Шейшемби' },
  { ru: 'Среда', en: 'Wednesday', ky: 'Шаршемби' },
  { ru: 'Четверг', en: 'Thursday', ky: 'Бейшемби' },
  { ru: 'Пятница', en: 'Friday', ky: 'Жума' },
  { ru: 'Суббота', en: 'Saturday', ky: 'Ишемби' },
  { ru: 'Воскресенье', en: 'Sunday', ky: 'Жекшемби' }
]
