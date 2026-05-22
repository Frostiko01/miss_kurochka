import { prisma } from '@/lib/prisma'

const REVENUE_STATUSES = ['completed', 'ready', 'delivering'] as const

interface AnalyticsArgs {
  branchId?: string // если не передан — по всем филиалам (для админа)
  daysBack?: number // глубина графика, по умолчанию 7
}

interface DashboardStats {
  // Карточки
  todayOrders: number
  todayRevenue: number
  todayAvgCheck: number
  activeItems: number | null // null для админа
  stopListItems: number | null // null для админа
  pendingOrders: number
  totalOrdersAllTime: number
  totalRevenueAllTime: number
  activeUsers: number
  activeBranches: number

  // График продаж по дням
  salesByDay: Array<{ day: string; date: string; amount: number; ordersCount: number }>

  // Распределение по статусам
  byStatus: Array<{ status: string; count: number }>

  // Топ-5 блюд за 30 дней
  topItems: Array<{ menuItemId: string | null; name: string; quantity: number; revenue: number }>

  // Распределение pickup vs delivery
  byOrderType: { pickup: number; delivery: number }

  // Последние заказы
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    status: string
    orderType: string
    totalAmount: number
    createdAt: string
    branchName?: string
  }>

  // Метаданные
  branchName?: string
}

const DAY_LABELS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export async function getDashboardStats(
  args: AnalyticsArgs = {},
): Promise<DashboardStats> {
  const branchFilter: any = args.branchId ? { branchId: args.branchId } : {}
  const daysBack = args.daysBack ?? 7

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const fromGraph = new Date(today)
  fromGraph.setDate(fromGraph.getDate() - (daysBack - 1))

  const fromTopItems = new Date(today)
  fromTopItems.setDate(fromTopItems.getDate() - 30)

  // Параллельные запросы для производительности
  const [
    todayOrdersCount,
    todayRevenueAgg,
    activeItemsCount,
    stopListCount,
    pendingCount,
    totalOrdersAllTime,
    totalRevenueAllTime,
    activeUsers,
    activeBranches,
    graphOrders,
    byStatusGroup,
    topItems,
    byOrderTypeGroup,
    recentOrders,
    branch,
  ] = await Promise.all([
    // Заказы сегодня
    prisma.order.count({
      where: {
        ...branchFilter,
        createdAt: { gte: today, lt: tomorrow },
      },
    }),

    // Выручка сегодня
    prisma.order.aggregate({
      where: {
        ...branchFilter,
        createdAt: { gte: today, lt: tomorrow },
        status: { in: [...REVENUE_STATUSES] },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),

    // Активные блюда (если есть branchId — учитываем стоп-лист)
    args.branchId
      ? prisma.menuItem.count({
          where: {
            isActive: true,
            category: {
              OR: [{ branchId: args.branchId }, { branchId: null }],
            },
            stopList: {
              none: { branchId: args.branchId, restoredAt: null },
            },
          },
        })
      : prisma.menuItem.count({ where: { isActive: true } }),

    // В стоп-листе (только для филиала)
    args.branchId
      ? prisma.stopList.count({
          where: { branchId: args.branchId, restoredAt: null },
        })
      : Promise.resolve(0),

    // Ожидающие подтверждения
    prisma.order.count({
      where: {
        ...branchFilter,
        status: { in: ['pending', 'confirmed'] },
      },
    }),

    // Всего заказов за всё время
    prisma.order.count({ where: branchFilter }),

    // Всего выручки за всё время
    prisma.order.aggregate({
      where: { ...branchFilter, status: { in: [...REVENUE_STATUSES] } },
      _sum: { totalAmount: true },
    }),

    // Активные клиенты (роль customer + active)
    prisma.user.count({
      where: { role: 'customer', status: 'active' },
    }),

    // Активные филиалы
    prisma.branch.count({ where: { status: 'active' } }),

    // Заказы за последние N дней (для графика)
    prisma.order.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: fromGraph },
      },
      select: { createdAt: true, totalAmount: true, status: true },
    }),

    // Группировка по статусам (за всё время)
    prisma.order.groupBy({
      by: ['status'],
      where: branchFilter,
      _count: { _all: true },
    }),

    // Топ блюд за 30 дней
    prisma.orderItem.groupBy({
      by: ['menuItemId', 'itemName'],
      where: {
        order: {
          ...branchFilter,
          createdAt: { gte: fromTopItems },
          status: { in: [...REVENUE_STATUSES] },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),

    // Распределение pickup/delivery (за 30 дней)
    prisma.order.groupBy({
      by: ['orderType'],
      where: {
        ...branchFilter,
        createdAt: { gte: fromTopItems },
      },
      _count: { _all: true },
    }),

    // Последние 8 заказов
    prisma.order.findMany({
      where: branchFilter,
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        orderType: true,
        totalAmount: true,
        createdAt: true,
        branch: { select: { name: true } },
      },
    }),

    // Имя филиала, если задан
    args.branchId
      ? prisma.branch.findUnique({
          where: { id: args.branchId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ])

  // Группируем заказы по дням
  const byDay = new Map<string, { amount: number; ordersCount: number }>()
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(fromGraph)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    byDay.set(key, { amount: 0, ordersCount: 0 })
  }
  for (const o of graphOrders) {
    const key = o.createdAt.toISOString().slice(0, 10)
    const cur = byDay.get(key)
    if (!cur) continue
    cur.ordersCount += 1
    if (REVENUE_STATUSES.includes(o.status as any)) {
      cur.amount += Number(o.totalAmount)
    }
  }
  const salesByDay = Array.from(byDay.entries()).map(([dateStr, v]) => {
    const d = new Date(dateStr + 'T00:00:00')
    return {
      date: dateStr,
      day: DAY_LABELS_RU[d.getDay()],
      amount: v.amount,
      ordersCount: v.ordersCount,
    }
  })

  // pickup vs delivery
  let pickup = 0
  let delivery = 0
  for (const g of byOrderTypeGroup) {
    if (g.orderType === 'pickup') pickup = g._count._all
    else if (g.orderType === 'delivery') delivery = g._count._all
  }

  const todayRevenue = Number(todayRevenueAgg._sum.totalAmount || 0)
  const todayPaidCount = todayRevenueAgg._count._all
  const totalRevenueAll = Number(totalRevenueAllTime._sum.totalAmount || 0)

  return {
    todayOrders: todayOrdersCount,
    todayRevenue,
    todayAvgCheck: todayPaidCount > 0 ? todayRevenue / todayPaidCount : 0,
    activeItems: activeItemsCount,
    stopListItems: args.branchId ? stopListCount : null,
    pendingOrders: pendingCount,
    totalOrdersAllTime,
    totalRevenueAllTime: totalRevenueAll,
    activeUsers,
    activeBranches,
    salesByDay,
    byStatus: byStatusGroup.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    topItems: topItems.map((it) => ({
      menuItemId: it.menuItemId,
      name: it.itemName,
      quantity: it._sum.quantity ?? 0,
      revenue: Number(it._sum.totalPrice ?? 0),
    })),
    byOrderType: { pickup, delivery },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      orderType: o.orderType,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt.toISOString(),
      branchName: o.branch?.name,
    })),
    branchName: branch?.name,
  }
}
