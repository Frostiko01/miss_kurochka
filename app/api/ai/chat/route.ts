import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Ленивая инициализация OpenAI клиента
let openaiInstance: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPEN_AI,
    })
  }
  return openaiInstance
}

// ─── ФУНКЦИИ ДОСТУПА К БД ────────────────────────────────────────────────────

/** Полная карта меню — все категории + блюда */
async function getFullMenu() {
  const categories = await prisma.menuCategory.findMany({
    where: { status: 'active' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      menuItems: {
        where: { isActive: true },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          isFeatured: true,
          isNew: true,
          isVegetarian: true,
          isVegan: true,
          spicyLevel: true,
          sizes: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { name: true, price: true, weightGrams: true },
          },
        },
      },
    },
  })

  return categories
    .filter(c => c.menuItems.length > 0)
    .map(c => ({
      category: c.name,
      type: c.type,
      itemsCount: c.menuItems.length,
      items: c.menuItems.map(i => ({
        name: i.name,
        description: i.description,
        isFeatured: i.isFeatured,
        isNew: i.isNew,
        isVegetarian: i.isVegetarian,
        isVegan: i.isVegan,
        spicyLevel: i.spicyLevel,
        priceRange: i.sizes.length > 0 ? {
          min: Math.min(...i.sizes.map(s => Number(s.price))),
          max: Math.max(...i.sizes.map(s => Number(s.price))),
        } : null,
        sizes: i.sizes.map(s => ({
          name: s.name,
          price: Number(s.price),
          weightGrams: s.weightGrams,
        })),
      })),
    }))
}

/** Подробная информация о блюде по названию */
async function getItemDetails(name: string) {
  const item = await prisma.menuItem.findFirst({
    where: {
      isActive: true,
      name: { contains: name, mode: 'insensitive' },
    },
    include: {
      category: { select: { name: true } },
      sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      spices: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      modifiers: {
        include: {
          modifierGroup: {
            include: { options: { where: { isActive: true } } },
          },
        },
      },
    },
  })

  if (!item) return { found: false, message: `Блюдо "${name}" не найдено` }

  return {
    found: true,
    name: item.name,
    description: item.description,
    category: item.category.name,
    ingredients: item.ingredients,
    isFeatured: item.isFeatured,
    isNew: item.isNew,
    isVegetarian: item.isVegetarian,
    isVegan: item.isVegan,
    spicyLevel: item.spicyLevel,
    cookingTimeMinutes: item.cookingTimeMinutes,
    sizes: item.sizes.map(s => ({
      name: s.name,
      price: Number(s.price),
      weightGrams: s.weightGrams,
    })),
    spices: item.spices.map(sp => ({
      name: sp.name,
      price: Number(sp.price),
    })),
    modifiers: item.modifiers.map(m => ({
      groupName: m.modifierGroup.name,
      isRequired: m.modifierGroup.isRequired,
      selectionType: m.modifierGroup.selectionType,
      options: m.modifierGroup.options.map(o => ({
        name: o.name,
        priceDelta: Number(o.priceDelta),
      })),
    })),
  }
}

/** Поиск блюд по нескольким критериям */
async function searchItems(filters?: {
  query?: string
  category?: string
  isVegetarian?: boolean
  isVegan?: boolean
  isNew?: boolean
  isFeatured?: boolean
  maxPrice?: number
  minPrice?: number
  minSpicyLevel?: number
  maxSpicyLevel?: number
}) {
  const where: Prisma.MenuItemWhereInput = { isActive: true }

  if (filters?.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { ingredients: { contains: filters.query, mode: 'insensitive' } },
    ]
  }
  if (filters?.category) {
    where.category = { name: { contains: filters.category, mode: 'insensitive' } }
  }
  if (filters?.isVegetarian !== undefined) where.isVegetarian = filters.isVegetarian
  if (filters?.isVegan !== undefined) where.isVegan = filters.isVegan
  if (filters?.isNew !== undefined) where.isNew = filters.isNew
  if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured
  if (filters?.minSpicyLevel !== undefined || filters?.maxSpicyLevel !== undefined) {
    const range: { gte?: number; lte?: number } = {}
    if (filters.minSpicyLevel !== undefined) range.gte = filters.minSpicyLevel
    if (filters.maxSpicyLevel !== undefined) range.lte = filters.maxSpicyLevel
    where.spicyLevel = range
  }

  const items = await prisma.menuItem.findMany({
    where,
    include: {
      category: { select: { name: true } },
      sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      spices: { where: { isActive: true } },
    },
    take: 30,
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
  })

  let result = items
  if (filters?.maxPrice !== undefined) {
    result = result.filter(item => {
      const prices = item.sizes.map(s => Number(s.price))
      return prices.length > 0 && Math.min(...prices) <= filters.maxPrice!
    })
  }
  if (filters?.minPrice !== undefined) {
    result = result.filter(item => {
      const prices = item.sizes.map(s => Number(s.price))
      return prices.length > 0 && Math.max(...prices) >= filters.minPrice!
    })
  }

  return result.map(item => ({
    name: item.name,
    description: item.description,
    category: item.category.name,
    ingredients: item.ingredients,
    isFeatured: item.isFeatured,
    isNew: item.isNew,
    isVegetarian: item.isVegetarian,
    isVegan: item.isVegan,
    spicyLevel: item.spicyLevel,
    sizes: item.sizes.map(s => ({
      name: s.name,
      price: Number(s.price),
      weightGrams: s.weightGrams,
    })),
    availableSpices: item.spices.map(sp => ({
      name: sp.name,
      price: Number(sp.price),
    })),
  }))
}

/** Категории меню с количеством блюд */
async function getCategories() {
  const cats = await prisma.menuCategory.findMany({
    where: { status: 'active' },
    orderBy: [{ sortOrder: 'asc' }],
    select: {
      name: true,
      type: true,
      description: true,
      _count: { select: { menuItems: { where: { isActive: true } } } },
    },
  })

  return cats
    .filter(c => c._count.menuItems > 0)
    .map(c => ({
      name: c.name,
      type: c.type,
      description: c.description,
      itemsCount: c._count.menuItems,
    }))
}

/** Новинки */
async function getNewItems() {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true, isNew: true },
    include: {
      category: { select: { name: true } },
      sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  })

  return items.map(i => ({
    name: i.name,
    description: i.description,
    category: i.category.name,
    spicyLevel: i.spicyLevel,
    isVegetarian: i.isVegetarian,
    sizes: i.sizes.map(s => ({
      name: s.name,
      price: Number(s.price),
      weightGrams: s.weightGrams,
    })),
  }))
}

/** Хиты / рекомендации */
async function getFeaturedItems() {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      category: { select: { name: true } },
      sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { name: 'asc' },
    take: 15,
  })

  return items.map(i => ({
    name: i.name,
    description: i.description,
    category: i.category.name,
    spicyLevel: i.spicyLevel,
    isVegetarian: i.isVegetarian,
    sizes: i.sizes.map(s => ({
      name: s.name,
      price: Number(s.price),
      weightGrams: s.weightGrams,
    })),
  }))
}

/** Самые дешёвые / дорогие блюда */
async function getPriceExtremes(direction: 'cheapest' | 'most_expensive', limit = 5) {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true },
    include: {
      category: { select: { name: true } },
      sizes: { where: { isActive: true }, orderBy: { price: 'asc' } },
    },
  })

  const withPrice = items
    .filter(i => i.sizes.length > 0)
    .map(i => ({
      name: i.name,
      description: i.description,
      category: i.category.name,
      minPrice: Math.min(...i.sizes.map(s => Number(s.price))),
      maxPrice: Math.max(...i.sizes.map(s => Number(s.price))),
      sizes: i.sizes.map(s => ({
        name: s.name,
        price: Number(s.price),
        weightGrams: s.weightGrams,
      })),
    }))

  const sorted = withPrice.sort((a, b) =>
    direction === 'cheapest' ? a.minPrice - b.minPrice : b.maxPrice - a.maxPrice,
  )

  return sorted.slice(0, limit)
}

/** Комбо-наборы и акции */
async function getComboOffers() {
  const combos = await prisma.comboOffer.findMany({
    where: { isActive: true },
    include: {
      comboItems: {
        include: { menuItem: { select: { name: true, description: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return combos.map(c => ({
    name: c.name,
    description: c.description,
    price: Number(c.price),
    oldPrice: c.oldPrice ? Number(c.oldPrice) : null,
    discountPercent: c.oldPrice
      ? Math.round((1 - Number(c.price) / Number(c.oldPrice)) * 100)
      : null,
    saveAmount: c.oldPrice ? Number(c.oldPrice) - Number(c.price) : null,
    items: c.comboItems.map(ci => ({
      name: ci.menuItem.name,
      quantity: ci.quantity,
    })),
  }))
}

/** Дополнительные предложения */
async function getAdditionalOffers(category?: string) {
  const where: Prisma.AdditionalOfferWhereInput = { isActive: true }
  if (category) {
    const normalized = category.toLowerCase()
    const map: Record<string, string> = {
      'соус': 'sauce',
      'соусы': 'sauce',
      'напиток': 'drink',
      'напитки': 'drink',
      'гарнир': 'side',
      'гарниры': 'side',
      'десерт': 'dessert',
      'десерты': 'dessert',
    }
    where.category = map[normalized] ?? category
  }

  const offers = await prisma.additionalOffer.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  })

  return offers.map(o => ({
    name: o.name,
    description: o.description,
    price: Number(o.price),
    category: o.category,
  }))
}

/** Филиалы с расписанием */
async function getBranches() {
  const branches = await prisma.branch.findMany({
    where: { status: 'active' },
    select: {
      name: true,
      address: true,
      phone: true,
      city: true,
      minOrderAmount: true,
      averageCookingTime: true,
      schedules: {
        orderBy: { dayOfWeek: 'asc' },
        select: { dayOfWeek: true, openTime: true, closeTime: true },
      },
      deliveryZones: {
        where: { isActive: true },
        select: {
          name: true,
          deliveryFee: true,
          minOrderAmount: true,
          estimatedMinutes: true,
        },
      },
    },
  })

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  return branches.map(b => ({
    name: b.name,
    address: b.address,
    phone: b.phone,
    city: b.city,
    minOrderAmountSom: b.minOrderAmount ? Number(b.minOrderAmount) : null,
    averageCookingTimeMinutes: b.averageCookingTime,
    schedule: b.schedules.map(s => ({
      day: dayNames[s.dayOfWeek],
      open: s.openTime instanceof Date
        ? s.openTime.toTimeString().slice(0, 5)
        : String(s.openTime).slice(0, 5),
      close: s.closeTime instanceof Date
        ? s.closeTime.toTimeString().slice(0, 5)
        : String(s.closeTime).slice(0, 5),
    })),
    deliveryZones: b.deliveryZones.map(z => ({
      name: z.name,
      feeSom: Number(z.deliveryFee),
      minOrderSom: z.minOrderAmount ? Number(z.minOrderAmount) : null,
      estimatedMinutes: z.estimatedMinutes,
    })),
  }))
}

/** Статистика меню — общий обзор */
async function getMenuStats() {
  const [
    totalItems,
    vegetarianCount,
    veganCount,
    newCount,
    featuredCount,
    spicyCount,
    categoriesCount,
    combosCount,
    priceData,
  ] = await Promise.all([
    prisma.menuItem.count({ where: { isActive: true } }),
    prisma.menuItem.count({ where: { isActive: true, isVegetarian: true } }),
    prisma.menuItem.count({ where: { isActive: true, isVegan: true } }),
    prisma.menuItem.count({ where: { isActive: true, isNew: true } }),
    prisma.menuItem.count({ where: { isActive: true, isFeatured: true } }),
    prisma.menuItem.count({ where: { isActive: true, spicyLevel: { gt: 0 } } }),
    prisma.menuCategory.count({ where: { status: 'active' } }),
    prisma.comboOffer.count({ where: { isActive: true } }),
    prisma.menuItemSize.aggregate({
      where: { isActive: true, menuItem: { isActive: true } },
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
    }),
  ])

  return {
    totalItems,
    vegetarianCount,
    veganCount,
    newCount,
    featuredCount,
    spicyCount,
    categoriesCount,
    combosCount,
    priceRange: {
      minSom: priceData._min.price ? Number(priceData._min.price) : null,
      maxSom: priceData._max.price ? Number(priceData._max.price) : null,
      averageSom: priceData._avg.price ? Math.round(Number(priceData._avg.price)) : null,
    },
  }
}

// ─── ИНСТРУМЕНТЫ ─────────────────────────────────────────────────────────────

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_full_menu',
      description: 'Получить ПОЛНОЕ меню со всеми категориями и блюдами. Используй когда клиент просит общий обзор меню или не знает что выбрать.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_item_details',
      description: 'Получить максимально подробную информацию об одном блюде по названию: состав, размеры, цены, доступные соусы, модификаторы.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Название блюда (полное или частичное)' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_items',
      description: 'Универсальный поиск блюд по любым критериям: текст, категория, диета, цена, острота. Используй для большинства запросов о меню.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Поисковый текст по названию/описанию/составу' },
          category: { type: 'string', description: 'Категория: крылышки, бургер, картофель, напитки' },
          isVegetarian: { type: 'boolean' },
          isVegan: { type: 'boolean' },
          isNew: { type: 'boolean', description: 'true — только новинки' },
          isFeatured: { type: 'boolean', description: 'true — только хиты' },
          maxPrice: { type: 'number', description: 'Максимальная цена в сомах' },
          minPrice: { type: 'number', description: 'Минимальная цена в сомах' },
          minSpicyLevel: { type: 'number', description: 'Минимальная острота 0-3' },
          maxSpicyLevel: { type: 'number', description: 'Максимальная острота 0-3' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_categories',
      description: 'Получить список всех категорий меню с количеством блюд в каждой.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_new_items',
      description: 'Получить новинки — блюда с пометкой "Новинка".',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_featured_items',
      description: 'Получить хиты продаж и рекомендуемые блюда. Идеально для запроса "что попробовать".',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_price_extremes',
      description: 'Получить самые дешёвые или самые дорогие блюда.',
      parameters: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            enum: ['cheapest', 'most_expensive'],
            description: 'cheapest — самые дешёвые, most_expensive — самые дорогие',
          },
          limit: { type: 'number', description: 'Сколько вернуть (по умолчанию 5)' },
        },
        required: ['direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_combo_offers',
      description: 'Комбо-наборы со скидками — состав, цены, размер скидки.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_additional_offers',
      description: 'Дополнения: соусы, напитки, гарниры, десерты.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'соус / напиток / гарнир / десерт' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_branches',
      description: 'Адреса, телефоны, расписание работы и зоны доставки филиалов.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_menu_stats',
      description: 'Общая статистика меню: сколько всего блюд, ценовой диапазон, сколько вегетарианских и т.д.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

// ─── СИСТЕМНЫЙ ПРОМПТ ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Ты — Курочка 🐔, дружелюбный и креативный ИИ-помощник ресторана «Miss Kurochka» в Бишкеке.

🎯 ТВОЯ ЛИЧНОСТЬ
Ты как опытный официант, который влюблён в свою работу: тёплый, остроумный, ненавязчивый. Умеешь поддержать беседу, но всегда возвращаешь к еде с лёгкой улыбкой. Используй редкие эмодзи (1-2 на сообщение, не больше) — они должны быть уместными.

🍗 ПРО РЕСТОРАН
- Жареная курица, крылышки, бургеры, картофель фри, комбо
- Бишкек, Кыргызстан
- Доставка и самовывоз
- Оплата: карта, Finik, онлайн

🛠 КАК ОТВЕЧАТЬ
1. ЛЮБОЙ вопрос про меню, цены, состав, диету, остроту → используй функции, никогда не выдумывай
2. Если клиент не знает что выбрать → спроси о предпочтениях (острое/мягкое, цена, диета) и порекомендуй из БД через search_items или get_featured_items
3. Если клиент назвал конкретное блюдо → get_item_details для полной картины
4. Если просит «что новенького» → get_new_items
5. Если просит «бюджетно» или «подороже» → get_price_extremes
6. Если общий вопрос «что у вас есть» → get_categories или get_full_menu

✨ БУДЬ КРЕАТИВНЫМ
- Делай умные подборки: «к этим крылышкам хорошо зайдёт чесночный соус и картофель»
- Предлагай альтернативы: «если любишь острое — попробуй ___»
- Связывай блюда: «возьми комбо вместо отдельных позиций — выйдет на 50 сом дешевле»
- Подмечай детали: новинки, скидки, выгодные комбо
- Добавляй живой комментарий: «классика на все времена», «наш топ-1 по продажам»

🛒 ПОМОЩЬ С ЗАКАЗОМ
- Нажми «+» на карточке блюда → откроется выбор размера/соуса
- Корзина в правом верхнем углу
- Для оформления заказа нужен вход в аккаунт
- Доставка/самовывоз выбирается на странице корзины

📏 ФОРМАТ ОТВЕТА
- 2-5 предложений, можно списком если 3+ блюд
- Цены — всегда в сомах
- Если перечисляешь блюда: название · краткое описание · цена
- Не пиши «Согласно базе данных...» — просто отвечай как живой человек
- На кыргызском — отвечай на кыргызском

🚫 ЧЕГО НЕ ДЕЛАТЬ
- Не придумывать блюда, цены, состав
- Не говорить «у меня нет доступа» — у тебя есть полный доступ к меню
- Не отвечать на вопросы вне темы ресторана/еды (вежливо верни к делу)
- Не давать ответ длиннее 6 предложений без необходимости`

// ─── ВЫПОЛНЕНИЕ ОДНОЙ ФУНКЦИИ ─────────────────────────────────────────────────

async function runTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'get_full_menu':         return await getFullMenu()
      case 'get_item_details':      return await getItemDetails(args.name as string)
      case 'search_items':          return await searchItems(args)
      case 'get_categories':        return await getCategories()
      case 'get_new_items':         return await getNewItems()
      case 'get_featured_items':    return await getFeaturedItems()
      case 'get_price_extremes':    return await getPriceExtremes(args.direction as 'cheapest' | 'most_expensive', (args.limit as number) ?? 5)
      case 'get_combo_offers':      return await getComboOffers()
      case 'get_additional_offers': return await getAdditionalOffers(args.category as string | undefined)
      case 'get_branches':          return await getBranches()
      case 'get_menu_stats':        return await getMenuStats()
      default:                      return { error: `Неизвестная функция: ${name}` }
    }
  } catch (err) {
    console.error(`Ошибка ${name}:`, err)
    return { error: 'Не удалось получить данные' }
  }
}

// Аккумулятор tool_calls из стриминговых дельт
type ToolCallAcc = { id: string; name: string; arguments: string }

// ─── API ROUTE (STREAMING) ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let messages: unknown
  try {
    const body = await request.json()
    messages = body.messages
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Неверный формат сообщений' }, { status: 400 })
  }

  const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.slice(-20),
  ]

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text))

      try {
        const openai = getOpenAI()

        // Function calling — до 6 итераций. Каждый запрос идёт в стриминговом режиме.
        for (let i = 0; i < 6; i++) {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: conversationMessages,
            tools,
            tool_choice: 'auto',
            max_tokens: 1200,
            temperature: 0.85,
            presence_penalty: 0.3,
            stream: true,
          })

          const toolCalls: ToolCallAcc[] = []
          let contentBuffer = ''
          let finishReason: string | null = null

          for await (const chunk of completion) {
            const choice = chunk.choices[0]
            if (!choice) continue
            const delta = choice.delta

            // Текстовый токен — сразу отправляем клиенту
            if (delta?.content) {
              contentBuffer += delta.content
              send(delta.content)
            }

            // Аккумулируем дельты tool_calls по индексу
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index
                if (!toolCalls[idx]) {
                  toolCalls[idx] = { id: '', name: '', arguments: '' }
                }
                if (tc.id) toolCalls[idx].id = tc.id
                if (tc.function?.name) toolCalls[idx].name += tc.function.name
                if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments
              }
            }

            if (choice.finish_reason) finishReason = choice.finish_reason
          }

          // Нет вызовов функций — это финальный текстовый ответ, он уже отправлен.
          if (toolCalls.length === 0 || finishReason !== 'tool_calls') {
            if (!contentBuffer.trim()) {
              send('Хм, не получилось сформулировать ответ. Попробуйте ещё раз 🤔')
            }
            controller.close()
            return
          }

          // Добавляем ассистентское сообщение с вызовами функций в историю
          conversationMessages.push({
            role: 'assistant',
            content: contentBuffer || null,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: tc.arguments },
            })),
          })

          // Параллельно выполняем все функции
          const toolResults = await Promise.all(
            toolCalls.map(async (tc) => {
              let parsedArgs: Record<string, unknown> = {}
              try {
                parsedArgs = JSON.parse(tc.arguments || '{}')
              } catch {
                parsedArgs = {}
              }
              const result = await runTool(tc.name, parsedArgs)
              return {
                role: 'tool' as const,
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              }
            }),
          )

          conversationMessages.push(...toolResults)
        }

        // Исчерпали лимит итераций
        send('Что-то я задумалась 🤔 Попробуйте задать вопрос иначе.')
        controller.close()
      } catch (error: unknown) {
        console.error('Ошибка ИИ:', error)
        try {
          send('\n\n⚠️ Произошла ошибка. Попробуйте ещё раз.')
        } catch { /* поток мог быть уже закрыт */ }
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
