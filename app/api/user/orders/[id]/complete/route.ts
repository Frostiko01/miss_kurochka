import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// POST /api/user/orders/[id]/complete
// Клиент подтверждает что забрал заказ (только самовывоз в статусе ready)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        orderType: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
    }

    // Только самовывоз в статусе ready
    if (order.orderType !== 'pickup') {
      return NextResponse.json(
        { error: 'Только для заказов с самовывозом' },
        { status: 400 }
      )
    }

    if (order.status !== 'ready') {
      return NextResponse.json(
        { error: 'Заказ ещё не готов к выдаче' },
        { status: 400 }
      )
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'completed',
        deliveredAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        orderNumber: true,
      },
    })

    return NextResponse.json({ order: updated })
  } catch (error) {
    console.error('Error completing order:', error)
    return NextResponse.json(
      { error: 'Ошибка завершения заказа' },
      { status: 500 }
    )
  }
}
