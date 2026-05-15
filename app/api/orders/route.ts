import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// POST /api/orders - Создать новый заказ
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerComment,
      orderType,
      paymentMethod,
      deliveryAddressId,
    } = body

    // Получаем корзину пользователя
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
          },
        },
        branch: true,
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Корзина пуста" },
        { status: 400 }
      )
    }

    const branchId = cart.branchId
    const customerId = session.user.id

    // Валидация
    if (!branchId || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Не указаны обязательные поля' },
        { status: 400 }
      )
    }

    // Проверяем адрес доставки если тип заказа - доставка
    if (orderType === 'delivery' && !deliveryAddressId) {
      return NextResponse.json(
        { error: 'Не указан адрес доставки' },
        { status: 400 }
      )
    }

    // Проверяем стоп-лист филиала перед созданием заказа
    const menuItemIds = cart.items.map(item => item.menuItemId)
    const stopListItems = await prisma.stopList.findMany({
      where: {
        branchId,
        restoredAt: null,
        menuItemId: {
          in: menuItemIds,
        },
      },
      include: {
        menuItem: {
          select: {
            name: true,
          },
        },
      },
    })

    if (stopListItems.length > 0) {
      const unavailableItems = stopListItems.map(item => item.menuItem.name).join(', ')
      return NextResponse.json(
        {
          error: `Следующие блюда временно недоступны: ${unavailableItems}`,
          unavailableItems: stopListItems.map(item => ({
            menuItemId: item.menuItemId,
            name: item.menuItem.name,
            reason: item.reason,
          })),
        },
        { status: 400 }
      )
    }

    // Генерируем номер заказа
    const orderNumber = `ORD-${Date.now()}`

    // Рассчитываем общую сумму из корзины
    let totalAmount = 0
    const orderItemsData = []

    for (const cartItem of cart.items) {
      const menuItem = cartItem.menuItem

      if (!menuItem.isActive) {
        return NextResponse.json(
          { error: `Блюдо "${menuItem.name}" неактивно` },
          { status: 400 }
        )
      }

      let itemTotal = menuItem.price.toNumber() * cartItem.quantity
      const modifiersData = []

      // Добавляем стоимость модификаторов
      for (const mod of cartItem.modifiers) {
        const modPrice = mod.modifierOption.priceDelta.toNumber()
        itemTotal += modPrice * cartItem.quantity
        modifiersData.push({
          modifierOptionId: mod.modifierOptionId,
          priceDelta: modPrice,
        })
      }

      totalAmount += itemTotal

      orderItemsData.push({
        menuItemId: cartItem.menuItemId,
        quantity: cartItem.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        itemComment: cartItem.itemComment,
        modifiers: {
          create: modifiersData,
        },
      })
    }

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        orderNumber,
        branchId,
        customerId,
        customerName,
        customerPhone,
        customerComment,
        orderType: orderType || 'pickup',
        paymentMethod: paymentMethod || 'card',
        deliveryAddressId: orderType === 'delivery' ? deliveryAddressId : null,
        totalAmount,
        status: 'pending',
        items: {
          create: orderItemsData,
        },
        payments: {
          create: {
            paymentMethod: paymentMethod || 'card',
            amount: totalAmount,
            currency: 'KGS',
            status: 'pending',
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                images: true,
              },
            },
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
          },
        },
        payments: true,
        branch: true,
        deliveryAddress: true,
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Ошибка создания заказа' },
      { status: 500 }
    )
  }
}

// GET /api/orders - Получить заказы пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: session.user.id,
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                images: {
                  where: {
                    isPrimary: true,
                  },
                },
              },
            },
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
          },
        },
        payments: true,
        branch: true,
        deliveryAddress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Ошибка получения заказов' },
      { status: 500 }
    )
  }
}
