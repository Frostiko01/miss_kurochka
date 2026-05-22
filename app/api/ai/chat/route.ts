import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI,
})

// Функции для получения данных из БД
async function getMenuItems(filters?: { category?: string; isVegetarian?: boolean; maxPrice?: number }) {
  const where: any = { isActive: true }
  
  if (filters?.category) {
    where.category = { name: { contains: filters.category, mode: 'insensitive' } }
  }
  if (filters?.isVegetarian !== undefined) {
    where.isVegetarian = filters.isVegetarian
  }

  const items = await prisma.menuItem.findMany({
    where,
    include: {
      category: { select: { name: true } },
      sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      images: { where: { isPrimary: true }, take: 1 },
      modifiers: {
        include: {
          modifierGroup: {
            include: {
              options: { where: { isActive: true } }
            }
          }
        }
      }
    },
    take: 20,
    orderBy: { name: 'asc' }
  })

  // Фильтрация по цене после получения данных
  let filteredItems = items
  if (filters?.maxPrice) {
    filteredItems = items.filter(item => {
      const minPrice = Math.min(...item.sizes.map(s => Number(s.price)))
      return minPrice <= filters.maxPrice!
    })
  }

  return filteredItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category.name,
    sizes: item.sizes.map(s => ({
      name: s.name,
      price: Number(s.price),
      weight: s.weightGrams
    })),
    isVegetarian: item.isVegetarian,
    isVegan: item.isVegan,
    spicyLevel: item.spicyLevel,
    ingredients: item.ingredients,
    modifiers: item.modifiers.map(m => ({
      groupName: m.modifierGroup.name,
      isRequired: m.modifierGroup.isRequired,
      options: m.modifierGroup.options.map(o => ({
        name: o.name,
        priceDelta: Number(o.priceDelta)
      }))
    }))
  }))
}

async function getComboOffers() {
  const combos = await prisma.comboOffer.findMany({
    where: { isActive: true },
    include: {
      comboItems: {
        include: {
          menuItem: {
            select: { name: true }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { sortOrder: 'asc' },
    take: 10
  })

  return combos.map(combo => ({
    id: combo.id,
    name: combo.name,
    description: combo.description,
    price: Number(combo.price),
    oldPrice: combo.oldPrice ? Number(combo.oldPrice) : null,
    items: combo.comboItems.map(ci => ({
      name: ci.menuItem.name,
      quantity: ci.quantity
    }))
  }))
}

async function getAdditionalOffers(category?: string) {
  const where: any = { isActive: true }
  if (category) {
    where.category = { contains: category, mode: 'insensitive' }
  }

  const offers = await prisma.additionalOffer.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    take: 10
  })

  return offers.map(offer => ({
    id: offer.id,
    name: offer.name,
    description: offer.description,
    price: Number(offer.price),
    category: offer.category
  }))
}

async function getBranches() {
  const branches = await prisma.branch.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      city: true,
      minOrderAmount: true,
      averageCookingTime: true
    }
  })

  return branches.map(b => ({
    id: b.id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    city: b.city,
    minOrderAmount: b.minOrderAmount ? Number(b.minOrderAmount) : null,
    averageCookingTime: b.averageCookingTime
  }))
}

// Инструменты для ИИ (function calling)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_menu_items',
      description: 'Получить список блюд из меню с фильтрацией по категории, вегетарианству или цене',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Название категории (например: "бургер", "курица", "напитки")'
          },
          isVegetarian: {
            type: 'boolean',
            description: 'Фильтр по вегетарианским блюдам'
          },
          maxPrice: {
            type: 'number',
            description: 'Максимальная цена в сомах'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_combo_offers',
      description: 'Получить список комбо-наборов и акций',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_additional_offers',
      description: 'Получить дополнительные предложения (соусы, напитки, десерты)',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Категория дополнений (например: "соус", "напиток")'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_branches',
      description: 'Получить список филиалов ресторана с адресами и контактами',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
]

const SYSTEM_PROMPT = `Ты — дружелюбный ИИ-помощник ресторана быстрого питания «Miss Kurochka» (Мисс Курочка).

О ресторане:
- Специализация: курица, бургеры, комбо-наборы, картофель, напитки
- Работаем в Бишкеке, Кыргызстан
- Доставка и самовывоз
- Оплата: карта, Finik, онлайн

Твои задачи:
1. Помогать клиентам выбрать блюда по вкусу, бюджету и составу
2. Отвечать на вопросы о меню, составе блюд, аллергенах, ценах
3. Рассказывать об акциях и комбо-наборах
4. Помогать оформить заказ — объяснять как добавить в корзину
5. Отвечать на вопросы о доставке, времени работы, филиалах

У тебя есть доступ к актуальной базе данных:
- Используй get_menu_items для поиска блюд, цен, состава, модификаторов
- Используй get_combo_offers для информации о комбо и акциях
- Используй get_additional_offers для соусов, напитков, десертов
- Используй get_branches для адресов и контактов филиалов

Правила:
- Общайся на русском языке (если клиент пишет на кыргызском — отвечай на кыргызском)
- Будь кратким, дружелюбным и полезным
- ВСЕГДА используй функции для получения актуальных данных о ценах и меню
- Если клиент спрашивает про цену, состав или наличие — вызови соответствующую функцию
- Рекомендуй блюда на основе реальных данных из БД
- Если вопрос не связан с едой/рестораном — вежливо верни разговор к теме
- Максимальная длина ответа — 4-5 предложений
- Указывай цены в сомах (сом)`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    console.log('📨 Получен запрос к ИИ:', {
      messagesCount: messages?.length,
      lastMessage: messages?.[messages.length - 1]?.content
    })

    if (!messages || !Array.isArray(messages)) {
      console.error('❌ Неверный формат сообщений')
      return NextResponse.json({ error: 'Неверный формат сообщений' }, { status: 400 })
    }

    let conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-20)
    ]

    // Цикл для обработки function calling
    let maxIterations = 5
    let iteration = 0

    while (iteration < maxIterations) {
      iteration++

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        tools,
        tool_choice: 'auto',
        max_tokens: 800,
        temperature: 0.7,
      })

      const assistantMessage = response.choices[0]?.message

      if (!assistantMessage) {
        return NextResponse.json({ error: 'Нет ответа от ИИ' }, { status: 500 })
      }

      conversationMessages.push(assistantMessage)

      // Если нет вызовов функций — возвращаем ответ
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        const reply = assistantMessage.content ?? 'Извините, не смог сформировать ответ.'
        console.log('✅ Ответ ИИ (без вызова функций):', reply.substring(0, 100))
        return NextResponse.json({ reply })
      }

      console.log('🔧 ИИ вызывает функции:', assistantMessage.tool_calls.map(t => t.function.name))

      // Обрабатываем вызовы функций
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}')

        let functionResult: any

        try {
          console.log(`  → Вызов ${functionName} с параметрами:`, functionArgs)
          
          switch (functionName) {
            case 'get_menu_items':
              functionResult = await getMenuItems(functionArgs)
              break
            case 'get_combo_offers':
              functionResult = await getComboOffers()
              break
            case 'get_additional_offers':
              functionResult = await getAdditionalOffers(functionArgs.category)
              break
            case 'get_branches':
              functionResult = await getBranches()
              break
            default:
              functionResult = { error: 'Неизвестная функция' }
          }
          
          console.log(`  ✓ ${functionName} вернул ${Array.isArray(functionResult) ? functionResult.length : 'N/A'} результатов`)
        } catch (error) {
          console.error(`❌ Ошибка при вызове ${functionName}:`, error)
          functionResult = { error: 'Ошибка получения данных' }
        }

        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult)
        })
      }
    }

    // Если достигли лимита итераций
    return NextResponse.json({ 
      reply: 'Извините, произошла ошибка при обработке запроса. Попробуйте переформулировать вопрос.' 
    })

  } catch (error: unknown) {
    console.error('❌ Критическая ошибка ИИ:', error)
    const message = error instanceof Error ? error.message : 'Ошибка ИИ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
