import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notifyNewOrder } from '@/lib/notifications'
import { pickBestBranch } from '@/lib/branchSelector'

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
      pickupBranchId,
    } = body

    // Если это доставка и указан адрес, получаем его (с координатами)
    let deliveryAddressText = ''
    let deliveryCoord: { lat: number; lng: number } | null = null
    let rawAddressLine: string | null = null
    if (orderType === 'delivery' && deliveryAddressId) {
      const address = await prisma.deliveryAddress.findUnique({
        where: { id: deliveryAddressId },
        select: {
          addressLine: true,
          apartment: true,
          entrance: true,
          floor: true,
          intercom: true,
          comment: true,
          latitude: true,
          longitude: true,
        },
      })
      if (address) {
        rawAddressLine = address.addressLine
        if (address.latitude !== null && address.longitude !== null) {
          deliveryCoord = {
            lat: Number(address.latitude),
            lng: Number(address.longitude),
          }
        }
        // Если у сохранённого адреса нет координат — геокодируем сразу
        // и сохраняем координаты в БД для будущих заказов
        if (!deliveryCoord && address.addressLine) {
          const { geocodeAddress } = await import('@/lib/branchSelector')
          const geocoded = await geocodeAddress(address.addressLine)
          if (geocoded) {
            deliveryCoord = geocoded
            // Обновляем адрес с координатами чтобы следующий заказ был быстрее
            await prisma.deliveryAddress.update({
              where: { id: deliveryAddressId },
              data: { latitude: geocoded.lat, longitude: geocoded.lng },
            }).catch(() => {}) // best-effort
          }
        }
        deliveryAddressText = `\n📍 Адрес доставки: ${address.addressLine}`
        if (address.apartment) deliveryAddressText += `, кв. ${address.apartment}`
        if (address.entrance) deliveryAddressText += `, под. ${address.entrance}`
        if (address.floor) deliveryAddressText += `, эт. ${address.floor}`
        if (address.intercom) deliveryAddressText += `, домофон: ${address.intercom}`
        if (address.comment) deliveryAddressText += `\n💬 ${address.comment}`
      }
    }

    // Объединяем комментарий пользователя с адресом
    const finalComment = customerComment
      ? `${customerComment}${deliveryAddressText}`
      : deliveryAddressText || null

    // Получаем корзину пользователя
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                sizes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
              },
            },
            comboOffer: true,
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
            spices: {
              include: {
                spice: true,
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

    let branchId = cart.branchId
    const customerId = session.user.id

    console.log('📦 Создание заказа:', {
      cartBranchId: cart.branchId,
      customerName,
      customerPhone,
      orderType,
      pickupBranchId,
      deliveryCoord,
    })

    // Подбор филиала:
    // - pickup: используем филиал, выбранный пользователем
    // - delivery: ближайший филиал по координатам адреса (или по геокодированию текста)
    const picked = await pickBestBranch({
      preferredBranchId: orderType === 'pickup' ? pickupBranchId ?? null : null,
      customerCoord: orderType === 'delivery' ? deliveryCoord : null,
      addressText: orderType === 'delivery' ? rawAddressLine : null,
    })

    if (picked) {
      branchId = picked.branchId
      console.log(
        `✅ Выбран филиал ${picked.branchId} (${picked.reason}` +
          (picked.distanceKm !== undefined
            ? `, ${picked.distanceKm.toFixed(2)} км`
            : '') +
          ')',
      )

      // Обновляем корзину, чтобы стоп-лист и остальная логика были консистентны
      if (cart.branchId !== branchId) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { branchId },
        })
      }
    }

    // Валидация
    if (!branchId) {
      return NextResponse.json(
        { error: 'Не удалось определить филиал. Пожалуйста, попробуйте снова.' },
        { status: 400 }
      )
    }
    
    if (!customerName) {
      return NextResponse.json(
        { error: 'Не указано имя клиента' },
        { status: 400 }
      )
    }

    // Если телефон не указан, используем значение по умолчанию
    const phone = customerPhone || 'Не указан'

    // Проверяем адрес доставки если тип заказа - доставка (необязательно, сохраняется в комментарии)
    if (orderType === 'delivery' && !deliveryAddressId && !customerComment) {
      console.log('⚠️ Заказ на доставку без указания адреса')
    }

    // Проверяем стоп-лист филиала только для обычных блюд
    const menuItemIds = cart.items
      .map(item => item.menuItemId)
      .filter((id): id is string => !!id)

    if (menuItemIds.length > 0) {
      const stopListItems = await prisma.stopList.findMany({
        where: {
          branchId,
          restoredAt: null,
          menuItemId: { in: menuItemIds },
        },
        include: {
          menuItem: { select: { name: true } },
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
    }

    // Генерируем короткий номер заказа в формате: ORD - 123456 (ровно 6 цифр)
    const random6digits = Math.floor(100000 + Math.random() * 900000); // Генерирует от 100000 до 999999
    const orderNumber = `ORD - ${random6digits}`;

    // Рассчитываем общую сумму из корзины
    let totalAmount = 0
    const orderItemsData: any[] = []

    for (const cartItem of cart.items) {
      // Комбо-позиция
      if (cartItem.comboOffer) {
        const combo = cartItem.comboOffer
        if (!combo.isActive) {
          return NextResponse.json(
            { error: `Комбо "${combo.name}" неактивно` },
            { status: 400 }
          )
        }
        const unitPrice = Number(combo.price)
        const itemTotal = unitPrice * cartItem.quantity
        totalAmount += itemTotal
        orderItemsData.push({
          comboOfferId: combo.id,
          itemName: combo.name,
          quantity: cartItem.quantity,
          unitPrice,
          totalPrice: itemTotal,
          itemComment: cartItem.itemComment,
        })
        continue
      }

      // Обычное блюдо
      const menuItem = cartItem.menuItem
      if (!menuItem) continue

      if (!menuItem.isActive) {
        return NextResponse.json(
          { error: `Блюдо "${menuItem.name}" неактивно` },
          { status: 400 }
        )
      }

      let unitPrice = 0
      // Берём цену выбранного размера (из sizeId позиции корзины)
      const sizes = (menuItem as any).sizes ?? []
      const selectedSize = cartItem.sizeId
        ? sizes.find((s: any) => s.id === cartItem.sizeId) ?? sizes[0]
        : sizes[0]
      if (selectedSize) {
        unitPrice = Number(selectedSize.price)
      }
      const modifiersData = []

      // Добавляем стоимость модификаторов
      for (const mod of cartItem.modifiers) {
        const modPrice = mod.modifierOption.priceDelta.toNumber()
        unitPrice += modPrice
        modifiersData.push({
          modifierOptionId: mod.modifierOptionId,
          priceDelta: modPrice,
        })
      }

      // Добавляем стоимость специй (каждая специя — фиксированная цена, не дельта)
      for (const cs of (cartItem as any).spices ?? []) {
        const spicePrice = Number(cs.spice?.price ?? 0)
        unitPrice += spicePrice
      }

      // Формируем название позиции с учётом вкуса
      const spiceNames = ((cartItem as any).spices ?? [])
        .map((cs: any) => cs.spice?.name)
        .filter(Boolean)
      const itemName = spiceNames.length > 0
        ? `${menuItem.name} (${spiceNames.join(', ')})`
        : menuItem.name

      const itemTotal = unitPrice * cartItem.quantity
      totalAmount += itemTotal

      orderItemsData.push({
        menuItemId: cartItem.menuItemId,
        itemName,
        quantity: cartItem.quantity,
        unitPrice,
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
        customerPhone: phone,
        customerComment: finalComment,
        orderType: orderType || 'pickup',
        paymentMethod: paymentMethod || 'card',
        totalAmount,
        deliveryAddressId: orderType === 'delivery' && deliveryAddressId ? deliveryAddressId : null,
        status: 'pending',
        items: {
          create: orderItemsData,
        },
        payments: {
          create: {
            paymentMethod: paymentMethod || 'card',
            amount: totalAmount,
            currency: 'KGS',
            status: paymentMethod === 'online' ? 'pending' : 'completed',
            completedAt: paymentMethod === 'online' ? null : new Date(),
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
            comboOffer: true,
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

    // Уведомление филиалу и админу о новом заказе (best-effort)
    const itemsCount = order.items.reduce((s, it) => s + it.quantity, 0)
    await notifyNewOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      branchId: order.branchId,
      branchName: order.branch?.name,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: Number(order.totalAmount),
      orderType: order.orderType as 'pickup' | 'delivery',
      itemsCount,
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
export async function GET() {
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
