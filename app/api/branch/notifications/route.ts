import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — список уведомлений для филиала текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'branch') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    })
    if (!branchUser) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const onlyUnread = url.searchParams.get('unread') === 'true'

    const where: any = {
      audience: 'branch',
      branchId: branchUser.branchId,
    }
    if (onlyUnread) where.isRead = false

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: {
          audience: 'branch',
          branchId: branchUser.branchId,
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({
      notifications: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        orderId: n.orderId,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    })
  } catch (error) {
    console.error('Branch notifications error:', error)
    const message =
      error instanceof Error ? error.message : 'Ошибка получения уведомлений'
    return NextResponse.json(
      { error: message, notifications: [], unreadCount: 0 },
      { status: 500 },
    )
  }
}

// PATCH — отметить уведомления как прочитанные
// body: { ids?: string[]; markAllAsRead?: boolean }
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'branch') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    })
    if (!branchUser) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    const body = await request.json()
    const { ids, markAllAsRead } = body as {
      ids?: string[]
      markAllAsRead?: boolean
    }

    const where: any = {
      audience: 'branch',
      branchId: branchUser.branchId,
      isRead: false,
    }
    if (!markAllAsRead) {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: 'Не указаны идентификаторы' },
          { status: 400 },
        )
      }
      where.id = { in: ids }
    }

    const result = await prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Branch notifications mark read error:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления' },
      { status: 500 },
    )
  }
}
