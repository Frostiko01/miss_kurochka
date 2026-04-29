import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/orders - Создать новый заказ
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      branchId,
      customerId,
      customerName,
      customerPhone,
      customerComment,
      orderType,
      paymentMethod,
      items, // [{ menuItemId, quantity, modifiers: [{ modifierOptionId }] }]
    } = body

    // Валидация
    if (!branchId || !customerName || !customerPhone || !items?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    // Генерируем номер заказа
    const orderNumber = `ORD-${Date.now()}`

    // Рассчитываем общую сумму
    let totalAmount = 0
    const orderItemsData = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      })

      if (!menuItem) {
        return NextResponse.json(
          {
            success: false,
            error: `Menu item ${item.menuItemId} not found`,
          },
          { status: 404 }
        )
      }

      let itemTotal = menuItem.price.toNumber() * item.quantity
      const modifiersData = []

      // Добавляем стоимость модификаторов
      if (item.modifiers?.length) {
        for (const mod of item.modifiers) {
          const modOption = await prisma.modifierOption.findUnique({
            where: { id: mod.modifierOptionId },
          })

          if (modOption) {
            const modPrice = modOption.priceDelta.toNumber()
            itemTotal += modPrice * item.quantity
            modifiersData.push({
              modifierOptionId: mod.modifierOptionId,
              priceDelta: modPrice,
            })
          }
        }
      }

      totalAmount += itemTotal

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        itemComment: item.comment,
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
        paymentMethod: paymentMethod || 'cash',
        totalAmount,
        status: 'pending',
        items: {
          create: orderItemsData,
        },
        payments: {
          create: {
            paymentMethod: paymentMethod || 'cash',
            amount: totalAmount,
            currency: 'KGS',
            status: 'pending',
          },
        },
      },
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
        payments: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
      },
      { status: 500 }
    )
  }
}

// GET /api/orders - Получить заказы
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')

    const orders = await prisma.order.findMany({
      where: {
        ...(customerId && { customerId }),
        ...(branchId && { branchId }),
        ...(status && { status: status as any }),
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
      },
      { status: 500 }
    )
  }
}
