import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createFinikPayment } from '@/lib/finik'
import { pickBestBranch } from '@/lib/branchSelector'

/**
 * POST /api/finik/create-payment
 *
 * 1. Создаёт заказ в БД (status=pending, payment.status=pending)
 * 2. Создаёт платёж в Finik с workId = order.id
 * 3. Возвращает URL платёжной страницы клиенту
 *
 * После успешной оплаты Finik отправит webhook на /api/finik/webhook,
 * который обновит статус заказа и оплаты на completed.
 *
 * ВАЖНО: цена ВСЕГДА фиксированная — 5 сом, не считается из БД.
 */

// Фиксированная сумма платежа (как просил клиент)
const FIXED_AMOUNT = 5

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8)
  const t0 = Date.now()
  const plog = (msg: string, extra?: Record<string, unknown>) => {
    const base = `[PAY ${reqId}] ${msg} (+${Date.now() - t0}мс)`
    if (extra) console.log(base, JSON.stringify(extra))
    else console.log(base)
  }
  try {
    plog('▶️ Старт создания платежа')
    const session = await auth()
    if (!session?.user?.id) {
      plog('⛔ Не авторизован')
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    plog('👤 Пользователь авторизован', { userId: session.user.id })

    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerComment,
      orderType,
      deliveryAddressId,
      pickupBranchId,
    } = body

    // Получаем адрес доставки и координаты
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
        deliveryAddressText = `\n📍 Адрес доставки: ${address.addressLine}`
        if (address.apartment) deliveryAddressText += `, кв. ${address.apartment}`
        if (address.entrance) deliveryAddressText += `, под. ${address.entrance}`
        if (address.floor) deliveryAddressText += `, эт. ${address.floor}`
        if (address.intercom) deliveryAddressText += `, домофон: ${address.intercom}`
        if (address.comment) deliveryAddressText += `\n💬 ${address.comment}`
      }
    }

    const finalComment = customerComment
      ? `${customerComment}${deliveryAddressText}`
      : deliveryAddressText || null

    // Получаем корзину
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
              },
            },
            comboOffer: true,
            modifiers: { include: { modifierOption: true } },
            spices: { include: { spice: true } },
          },
        },
        branch: true,
      },
    })

    if (!cart || cart.items.length === 0) {
      plog('🛒 Корзина пуста')
      return NextResponse.json({ error: 'Корзина пуста' }, { status: 400 })
    }
    plog('🛒 Корзина получена', { cartId: cart.id, itemsCount: cart.items.length, orderType })

    // Подбор филиала
    const picked = await pickBestBranch({
      preferredBranchId: orderType === 'pickup' ? pickupBranchId ?? null : null,
      customerCoord: orderType === 'delivery' ? deliveryCoord : null,
      addressText: orderType === 'delivery' ? rawAddressLine : null,
    })

    let branchId = cart.branchId
    if (picked) {
      branchId = picked.branchId
      if (cart.branchId !== branchId) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { branchId },
        })
      }
    }
    plog('🏬 Филиал определён', { branchId, picked: picked?.branchId ?? null })

    if (!branchId) {
      plog('⛔ Филиал не определён')
      return NextResponse.json(
        { error: 'Не удалось определить филиал. Пожалуйста, попробуйте снова.' },
        { status: 400 },
      )
    }

    if (!customerName) {
      return NextResponse.json({ error: 'Не указано имя клиента' }, { status: 400 })
    }

    const phone = customerPhone || 'Не указан'

    // Стоп-лист
    const menuItemIds = cart.items
      .map((item) => item.menuItemId)
      .filter((id): id is string => !!id)

    if (menuItemIds.length > 0) {
      const stopListItems = await prisma.stopList.findMany({
        where: {
          branchId,
          restoredAt: null,
          menuItemId: { in: menuItemIds },
        },
        include: { menuItem: { select: { name: true } } },
      })
      if (stopListItems.length > 0) {
        const unavailableItems = stopListItems.map((item) => item.menuItem.name).join(', ')
        return NextResponse.json(
          {
            error: `Следующие блюда временно недоступны: ${unavailableItems}`,
          },
          { status: 400 },
        )
      }
    }

    // Формируем позиции заказа
    // Генерируем короткий номер заказа в формате: ORD - 123456 (ровно 6 цифр)
    const random6digits = Math.floor(100000 + Math.random() * 900000); // Генерирует от 100000 до 999999
    const orderNumber = `ORD - ${random6digits}`;
    let totalAmount = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItemsData: any[] = []

    for (const cartItem of cart.items) {
      if (cartItem.comboOffer) {
        const combo = cartItem.comboOffer
        if (!combo.isActive) {
          return NextResponse.json(
            { error: `Комбо "${combo.name}" неактивно` },
            { status: 400 },
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

      const menuItem = cartItem.menuItem
      if (!menuItem) continue
      if (!menuItem.isActive) {
        return NextResponse.json(
          { error: `Блюдо "${menuItem.name}" неактивно` },
          { status: 400 },
        )
      }

      let unitPrice = 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sizes = (menuItem as any).sizes ?? []
      const selectedSize = cartItem.sizeId
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sizes.find((s: any) => s.id === cartItem.sizeId) ?? sizes[0]
        : sizes[0]
      if (selectedSize) unitPrice = Number(selectedSize.price)

      const modifiersData = []
      for (const mod of cartItem.modifiers) {
        const modPrice = Number(mod.modifierOption.priceDelta)
        unitPrice += modPrice
        modifiersData.push({
          modifierOptionId: mod.modifierOptionId,
          priceDelta: modPrice,
        })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const cs of (cartItem as any).spices ?? []) {
        const spicePrice = Number(cs.spice?.price ?? 0)
        unitPrice += spicePrice
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spiceNames = ((cartItem as any).spices ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((cs: any) => cs.spice?.name)
        .filter(Boolean)
      const itemName =
        spiceNames.length > 0 ? `${menuItem.name} (${spiceNames.join(', ')})` : menuItem.name

      const itemTotal = unitPrice * cartItem.quantity
      totalAmount += itemTotal

      orderItemsData.push({
        menuItemId: cartItem.menuItemId,
        itemName,
        quantity: cartItem.quantity,
        unitPrice,
        totalPrice: itemTotal,
        itemComment: cartItem.itemComment,
        modifiers: { create: modifiersData },
      })
    }

    plog('💰 Сумма заказа посчитана', { orderNumber, totalAmount, itemsInOrder: orderItemsData.length })

    // Создаём заказ со статусом pending — он ещё не виден филиалу как "оплаченный".
    // Платёж пока тоже pending — переключим на completed в webhook.
    const order = await prisma.order.create({
      data: {
        orderNumber,
        branchId,
        customerId: session.user.id,
        customerName,
        customerPhone: phone,
        customerComment: finalComment,
        orderType: orderType || 'pickup',
        paymentMethod: 'finik',
        totalAmount,
        deliveryAddressId:
          orderType === 'delivery' && deliveryAddressId ? deliveryAddressId : null,
        status: 'pending',
        items: { create: orderItemsData },
        payments: {
          create: {
            paymentMethod: 'finik',
            amount: totalAmount,
            currency: 'KGS',
            status: 'pending',
          },
        },
      },
      include: {
        items: true,
        branch: true,
        payments: true,
      },
    })
    plog('📝 Заказ создан в БД (pending)', { orderId: order.id, orderNumber: order.orderNumber })

    // Создаём платёж в Finik. Цена ФИКСИРОВАННАЯ — 5 сом.
    let paymentUrl: string
    try {
      plog('🔄 Вызываем createFinikPayment...', { amount: FIXED_AMOUNT, orderId: order.id })
      paymentUrl = await createFinikPayment({
        amount: FIXED_AMOUNT,
        workId: order.id,
        workTopic: `Payment for order ${order.orderNumber}`,
        userId: session.user.id,
      })
      console.log('✅ Finik payment created successfully:', paymentUrl)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      plog('❌ Ошибка создания платежа Finik', { message: msg, orderId: order.id })
      console.error('❌ Failed to create Finik payment:', {
        error: e,
        message: msg,
        stack: e instanceof Error ? e.stack : undefined,
        orderId: order.id,
        orderNumber: order.orderNumber,
      })

      // Откатываем заказ если не получилось создать платёж
      await prisma.order
        .delete({ where: { id: order.id } })
        .then(() => plog('↩️ Заказ откатан (удалён) после ошибки платежа', { orderId: order.id }))
        .catch((deleteError) => {
          plog('⚠️ Не удалось удалить заказ после ошибки платежа', { orderId: order.id })
          console.error('Failed to delete order after payment error:', deleteError)
        })
      // Если упал сам шлюз Finik (502/503/504) — отдаём 503 с понятным текстом,
      // чтобы фронт показал «сервис оплаты недоступен», а не общую ошибку.
      const isGatewayDown = /Finik временно недоступен|HTTP 50[234]/.test(msg)
      plog('🔚 Возврат ошибки клиенту', { status: isGatewayDown ? 503 : 500, isGatewayDown })
      return NextResponse.json(
        {
          error: isGatewayDown
            ? 'Платёжный сервис временно недоступен. Попробуйте оплатить позже.'
            : 'Не удалось создать платёж. Попробуйте позже.',
          details: msg,
        },
        { status: isGatewayDown ? 503 : 500 },
      )
    }
    plog('✅ Платёж Finik создан, есть URL', { orderId: order.id })

    // Уведомление филиала ОТЛОЖЕНО до момента успешной оплаты (см. webhook).
    // До оплаты заказ pending и не должен показываться филиалу как новый.
    plog('🏁 Готово, отдаём paymentUrl клиенту')

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: FIXED_AMOUNT,
    })
  } catch (error) {
    plog('💥 Необработанная ошибка', { message: error instanceof Error ? error.message : 'Unknown error' })
    console.error('Error creating Finik payment:', error)
    return NextResponse.json(
      {
        error: 'Failed to create payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
