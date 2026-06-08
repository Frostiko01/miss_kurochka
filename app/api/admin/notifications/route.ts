import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// GET — список уведомлений для админов (со всех филиалов)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const onlyUnread = url.searchParams.get('unread') === 'true'

    const where: Prisma.NotificationWhereInput = { audience: 'admin' }
    if (onlyUnread) where.isRead = false

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { audience: 'admin', isRead: false },
      }),
    ])

    // Подтянем имена филиалов
    const branchIds = Array.from(
      new Set(items.map((n) => n.branchId).filter((id): id is string => !!id)),
    )
    const branches = branchIds.length > 0
      ? await prisma.branch.findMany({
          where: { id: { in: branchIds } },
          select: { id: true, name: true },
        })
      : []
    const branchMap = new Map(branches.map((b) => [b.id, b.name]))

    return NextResponse.json({
      notifications: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        orderId: n.orderId,
        branchId: n.branchId,
        branchName: n.branchId ? branchMap.get(n.branchId) ?? null : null,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    })
  } catch (error) {
    console.error('Admin notifications error:', error)
    const message =
      error instanceof Error ? error.message : 'Ошибка получения уведомлений'
    return NextResponse.json(
      { error: message, notifications: [], unreadCount: 0 },
      { status: 500 },
    )
  }
}

// PATCH — отметить уведомления как прочитанные
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, markAllAsRead } = body as {
      ids?: string[]
      markAllAsRead?: boolean
    }

    const where: any = { audience: 'admin', isRead: false }
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
    console.error('Admin notifications mark read error:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления' },
      { status: 500 },
    )
  }
}
