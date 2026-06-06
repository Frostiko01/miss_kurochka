import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyFinikWebhook,
  isTimestampValid,
  FinikWebhookData,
} from '@/lib/finik'
import { notifyNewOrder } from '@/lib/notifications'

/**
 * POST /api/finik/webhook
 *
 * Обработка webhook от Finik после завершения платежа.
 * При успехе — переводит заказ в confirmed (виден филиалу как оплаченный)
 * и обновляет Payment.status = completed.
 */
export async function POST(request: NextRequest) {
  const hookId = Math.random().toString(36).slice(2, 8)
  const wlog = (msg: string, extra?: Record<string, unknown>) => {
    const base = `[WEBHOOK ${hookId}] ${msg}`
    if (extra) console.log(base, JSON.stringify(extra))
    else console.log(base)
  }
  try {
    wlog('📨 Входящий webhook от Finik')
    const signature = request.headers.get('signature')
    const timestamp = request.headers.get('x-api-timestamp')
    const host = request.headers.get('host')

    wlog('🔎 Заголовки', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      host,
    })

    if (!signature || !timestamp) {
      wlog('⛔ Нет signature или timestamp')
      console.error('[finik/webhook] Missing signature or timestamp')
      return NextResponse.json(
        { error: 'Missing signature or timestamp' },
        { status: 400 },
      )
    }

    if (!isTimestampValid(timestamp)) {
      wlog('⛔ Просроченный/некорректный timestamp', { timestamp })
      console.error('[finik/webhook] Webhook timestamp is too old or invalid')
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 })
    }

    const body: FinikWebhookData = await request.json()
    wlog('📦 Тело webhook', {
      id: body.id,
      transactionId: body.transactionId,
      status: body.status,
      amount: body.amount,
    })

    const headers: Record<string, string> = {
      host: host || '',
    }

    const isValid = await verifyFinikWebhook(
      signature,
      timestamp,
      body as unknown as Record<string, unknown>,
      headers,
      '/api/finik/webhook',
    )
    wlog(isValid ? '✅ Подпись webhook валидна' : '⚠️ Подпись webhook НЕ валидна')

    if (!isValid) {
      console.error('[finik/webhook] Invalid webhook signature')
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Достаём метаданные
    let metadata: { userId?: string; workId?: string; paymentId?: string } = {}
    try {
      if (body.data && body.data.metadata) {
        if (typeof body.data.metadata === 'string') {
          metadata = JSON.parse(body.data.metadata)
        } else {
          metadata = body.data.metadata as typeof metadata
        }
      }
    } catch (error) {
      console.error('[finik/webhook] Error parsing metadata:', error)
    }

    const status = String(body.status).toUpperCase()
    wlog('🏷️ Статус платежа', { status, workId: metadata.workId, userId: metadata.userId })

    // Успешная оплата
    if (status === 'SUCCEEDED') {
      const { userId, workId } = metadata
      if (!userId || !workId) {
        wlog('⛔ Нет userId или workId в metadata')
        console.error('[finik/webhook] Missing userId or workId in metadata')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      try {
        // 1. Обновляем платёж
        const payRes = await prisma.payment.updateMany({
          where: { orderId: workId, status: 'pending' },
          data: {
            status: 'completed',
            finikTransactionId: body.transactionId,
            completedAt: new Date(body.transactionDate || Date.now()),
          },
        })
        wlog('💳 Платёж обновлён на completed', { updated: payRes.count })

        // Защита от повторной обработки одного и того же webhook (Finik
        // ретраит при отсутствии 2xx). Если платёж уже был completed —
        // payRes.count === 0, дальнейшие действия не нужны.
        if (payRes.count === 0) {
          wlog('ℹ️ Платёж уже был обработан ранее — пропускаем уведомление и обновление')
          return NextResponse.json({ success: true, alreadyProcessed: true })
        }

        // 2. Подтверждаем заказ — теперь филиал видит его как оплаченный
        // и может начинать готовить
        const confirmedOrder = await prisma.order.update({
          where: { id: workId },
          data: { status: 'confirmed' },
          include: {
            items: true,
            branch: { select: { id: true, name: true } },
          },
        })
        wlog('📦 Заказ переведён в confirmed', { orderId: workId })

        // 3. Очищаем корзину пользователя
        const cart = await prisma.cart.findUnique({
          where: { userId },
        })
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
          wlog('🛒 Корзина очищена', { cartId: cart.id })
        }

        // 4. Уведомляем филиал и админа — заказ оплачен и готов к производству
        try {
          const itemsCount = confirmedOrder.items.reduce((s, it) => s + it.quantity, 0)
          await notifyNewOrder({
            orderId: confirmedOrder.id,
            orderNumber: confirmedOrder.orderNumber,
            branchId: confirmedOrder.branchId,
            branchName: confirmedOrder.branch?.name,
            customerName: confirmedOrder.customerName,
            customerPhone: confirmedOrder.customerPhone,
            totalAmount: Number(confirmedOrder.totalAmount),
            orderType: confirmedOrder.orderType as 'pickup' | 'delivery',
            itemsCount,
          })
          wlog('🔔 Уведомление о новом оплаченном заказе отправлено')
        } catch (notifyError) {
          // Уведомление не критично для платежа — логируем и идём дальше
          wlog('⚠️ Не удалось отправить уведомление', {
            message: notifyError instanceof Error ? notifyError.message : 'Unknown',
          })
        }

        wlog('🎉 ОПЛАТА УСПЕШНА', { order: workId, amount: body.amount, tx: body.transactionId })
        console.log(
          `[finik/webhook] PAYMENT_SUCCESS · order=${workId} · amount=${body.amount} · tx=${body.transactionId}`,
        )
      } catch (e) {
        wlog('❌ Ошибка обновления заказа', { message: e instanceof Error ? e.message : 'Unknown' })
        console.error('[finik/webhook] Error updating order:', e)
      }
    }
    // Неудачная оплата
    else if (status === 'FAILED') {
      const { workId } = metadata
      if (workId) {
        try {
          const failRes = await prisma.payment.updateMany({
            where: { orderId: workId, status: 'pending' },
            data: { status: 'failed' },
          })
          // Заказ тоже помечаем как cancelled, чтобы он не висел в pending
          // и не мешал клиенту повторить попытку оплаты новым заказом.
          await prisma.order.updateMany({
            where: { id: workId, status: 'pending' },
            data: { status: 'cancelled', cancelledAt: new Date() },
          })
          wlog('🔴 Платёж и заказ помечены как failed/cancelled', { order: workId, updated: failRes.count })
          console.error(
            `[finik/webhook] PAYMENT_FAILED · order=${workId} · tx=${body.transactionId}`,
          )
        } catch (e) {
          console.error('[finik/webhook] Error marking payment as failed:', e)
        }
      }
    } else {
      wlog('ℹ️ Прочий статус, без действий', { status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    wlog('💥 Ошибка обработки webhook', { message: error instanceof Error ? error.message : 'Unknown' })
    console.error('[finik/webhook] Error processing webhook:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
