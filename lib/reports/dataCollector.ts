import { prisma } from '@/lib/prisma'
import type { ReportData, ReportSection, ReportTypeKey, ReportPeriod } from './types'
import { REPORT_TYPE_LABELS } from './types'

interface CollectArgs {
  type: ReportTypeKey
  period: ReportPeriod
  branchId?: string // если указан — только этот филиал
  branchName?: string
}

const fmtMoney = (n: number) => `${n.toFixed(2)} сом`
const fmtDate = (d: Date) =>
  d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtDateTime = (d: Date) =>
  d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтвержден',
  preparing: 'Готовится',
  ready: 'Готов',
  delivering: 'Доставка',
  completed: 'Завершен',
  cancelled: 'Отменен',
}

// Отчет по продажам (агрегаты по дням + общие итоги)
async function buildSalesSection(args: CollectArgs): Promise<ReportSection> {
  const where: any = {
    createdAt: { gte: args.period.start, lte: args.period.end },
    status: { in: ['completed', 'ready', 'delivering'] },
  }
  if (args.branchId) where.branchId = args.branchId

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      totalAmount: true,
      createdAt: true,
      orderType: true,
      paymentMethod: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Группируем по дням
  const byDay = new Map<string, { count: number; revenue: number; pickup: number; delivery: number }>()
  let totalRevenue = 0
  let pickupCount = 0
  let deliveryCount = 0

  for (const o of orders) {
    const dayKey = fmtDate(o.createdAt)
    const cur = byDay.get(dayKey) ?? { count: 0, revenue: 0, pickup: 0, delivery: 0 }
    cur.count += 1
    const amt = Number(o.totalAmount)
    cur.revenue += amt
    totalRevenue += amt
    if (o.orderType === 'pickup') {
      cur.pickup += 1
      pickupCount += 1
    } else {
      cur.delivery += 1
      deliveryCount += 1
    }
    byDay.set(dayKey, cur)
  }

  const rows = Array.from(byDay.entries()).map(([day, v]) => [
    day,
    v.count,
    v.pickup,
    v.delivery,
    fmtMoney(v.revenue),
  ])

  return {
    title: 'Продажи по дням',
    columns: ['Дата', 'Всего заказов', 'Самовывоз', 'Доставка', 'Выручка'],
    rows,
    summary: [
      { label: 'Всего заказов', value: String(orders.length) },
      { label: 'Самовывоз', value: String(pickupCount) },
      { label: 'Доставка', value: String(deliveryCount) },
      { label: 'Общая выручка', value: fmtMoney(totalRevenue) },
      {
        label: 'Средний чек',
        value: orders.length > 0 ? fmtMoney(totalRevenue / orders.length) : fmtMoney(0),
      },
    ],
  }
}

// Отчет по заказам (детальный список)
async function buildOrdersSection(args: CollectArgs): Promise<ReportSection> {
  const where: any = {
    createdAt: { gte: args.period.start, lte: args.period.end },
  }
  if (args.branchId) where.branchId = args.branchId

  const orders = await prisma.order.findMany({
    where,
    select: {
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      orderType: true,
      status: true,
      paymentMethod: true,
      totalAmount: true,
      createdAt: true,
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  const rows = orders.map((o) => [
    o.orderNumber,
    fmtDateTime(o.createdAt),
    o.customerName,
    o.customerPhone,
    o.orderType === 'pickup' ? 'Самовывоз' : 'Доставка',
    ORDER_STATUS_LABELS[o.status] ?? o.status,
    fmtMoney(Number(o.totalAmount)),
    ...(args.branchId ? [] : [o.branch.name]),
  ])

  const cols = ['№ заказа', 'Дата', 'Клиент', 'Телефон', 'Тип', 'Статус', 'Сумма']
  if (!args.branchId) cols.push('Филиал')

  const completed = orders.filter((o) =>
    ['completed', 'ready', 'delivering'].includes(o.status),
  )
  const completedRevenue = completed.reduce((s, o) => s + Number(o.totalAmount), 0)
  const cancelled = orders.filter((o) => o.status === 'cancelled').length

  return {
    title: 'Список заказов',
    columns: cols,
    rows,
    summary: [
      { label: 'Всего заказов', value: String(orders.length) },
      { label: 'Завершенных', value: String(completed.length) },
      { label: 'Отмененных', value: String(cancelled) },
      { label: 'Выручка по завершенным', value: fmtMoney(completedRevenue) },
    ],
  }
}

// Популярные блюда (по количеству продаж)
async function buildPopularItemsSection(args: CollectArgs): Promise<ReportSection> {
  const where: any = {
    order: {
      createdAt: { gte: args.period.start, lte: args.period.end },
      status: { in: ['completed', 'ready', 'delivering'] },
    },
    menuItemId: { not: null },
  }
  if (args.branchId) where.order.branchId = args.branchId

  const items = await prisma.orderItem.groupBy({
    by: ['menuItemId', 'itemName'],
    where,
    _sum: { quantity: true, totalPrice: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 50,
  })

  const rows = items.map((it, idx) => [
    idx + 1,
    it.itemName,
    it._sum.quantity ?? 0,
    it._count._all,
    fmtMoney(Number(it._sum.totalPrice ?? 0)),
  ])

  const totalQty = items.reduce((s, it) => s + (it._sum.quantity ?? 0), 0)
  const totalRev = items.reduce((s, it) => s + Number(it._sum.totalPrice ?? 0), 0)

  return {
    title: 'Топ популярных блюд',
    columns: ['#', 'Название', 'Продано шт.', 'Заказов', 'Выручка'],
    rows,
    summary: [
      { label: 'Уникальных позиций', value: String(items.length) },
      { label: 'Всего продано шт.', value: String(totalQty) },
      { label: 'Общая выручка', value: fmtMoney(totalRev) },
    ],
  }
}

// Отчет по блюдам в меню (текущее состояние + продажи за период)
async function buildMenuItemsSection(args: CollectArgs): Promise<ReportSection> {
  const menuWhere: any = { isActive: true }
  if (args.branchId) {
    menuWhere.category = {
      OR: [{ branchId: args.branchId }, { branchId: null }],
    }
  }

  const items = await prisma.menuItem.findMany({
    where: menuWhere,
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
      sizes: {
        where: { isActive: true },
        select: { price: true },
        orderBy: { sortOrder: 'asc' },
      },
      isVegetarian: true,
      isFeatured: true,
    },
    orderBy: { name: 'asc' },
    take: 500,
  })

  // Считаем продажи каждого блюда
  const orderItemsWhere: any = {
    order: {
      createdAt: { gte: args.period.start, lte: args.period.end },
      status: { in: ['completed', 'ready', 'delivering'] },
    },
  }
  if (args.branchId) orderItemsWhere.order.branchId = args.branchId

  const sales = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: orderItemsWhere,
    _sum: { quantity: true, totalPrice: true },
  })
  const salesMap = new Map(
    sales.map((s) => [
      s.menuItemId ?? '',
      { qty: s._sum.quantity ?? 0, revenue: Number(s._sum.totalPrice ?? 0) },
    ]),
  )

  const rows = items.map((it) => {
    const minPrice = it.sizes.length > 0 ? Math.min(...it.sizes.map((s) => Number(s.price))) : 0
    const sale = salesMap.get(it.id) ?? { qty: 0, revenue: 0 }
    return [
      it.name,
      it.category.name,
      fmtMoney(minPrice),
      it.isVegetarian ? 'Да' : 'Нет',
      it.isFeatured ? 'Да' : 'Нет',
      sale.qty,
      fmtMoney(sale.revenue),
    ]
  })

  return {
    title: 'Блюда меню и продажи',
    columns: ['Название', 'Категория', 'Цена от', 'Вегетар.', 'Хит', 'Продано шт.', 'Выручка'],
    rows,
    summary: [
      { label: 'Всего блюд', value: String(items.length) },
      {
        label: 'С продажами',
        value: String(rows.filter((r) => Number(r[5]) > 0).length),
      },
    ],
  }
}

// Отчет по клиентам (новые регистрации, активные клиенты по заказам)
async function buildCustomersSection(args: CollectArgs): Promise<ReportSection> {
  // Пользователи, которые делали заказы в период
  const ordersWhere: any = {
    createdAt: { gte: args.period.start, lte: args.period.end },
    customerId: { not: null },
  }
  if (args.branchId) ordersWhere.branchId = args.branchId

  const customerOrders = await prisma.order.groupBy({
    by: ['customerId'],
    where: ordersWhere,
    _count: { _all: true },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 100,
  })

  const customerIds = customerOrders.map((c) => c.customerId!).filter(Boolean)
  const customers = await prisma.user.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
  })
  const customerMap = new Map(customers.map((c) => [c.id, c]))

  const rows = customerOrders.map((co, idx) => {
    const c = customerMap.get(co.customerId!)
    return [
      idx + 1,
      c?.fullName ?? '—',
      c?.phone ?? '—',
      c?.email ?? '—',
      co._count._all,
      fmtMoney(Number(co._sum.totalAmount ?? 0)),
    ]
  })

  // Новые регистрации за период
  const newUsers = await prisma.user.count({
    where: {
      role: 'customer',
      createdAt: { gte: args.period.start, lte: args.period.end },
    },
  })

  return {
    title: 'Активные клиенты',
    columns: ['#', 'Имя', 'Телефон', 'Email', 'Заказов', 'Сумма'],
    rows,
    summary: [
      { label: 'Активных клиентов в период', value: String(customerOrders.length) },
      { label: 'Новых регистраций', value: String(newUsers) },
    ],
  }
}

export async function collectReportData(args: CollectArgs): Promise<ReportData> {
  const sections: ReportSection[] = []

  // Каждую секцию оборачиваем в try/catch — если одна упадёт, отчёт не должен сломаться целиком
  const safeBuild = async (
    name: string,
    fn: () => Promise<ReportSection>,
  ): Promise<ReportSection> => {
    try {
      return await fn()
    } catch (e) {
      console.error(`[reports] Failed to build section "${name}":`, e)
      return {
        title: name,
        columns: ['Сообщение'],
        rows: [['Не удалось собрать данные. Попробуйте уменьшить период.']],
      }
    }
  }

  switch (args.type) {
    case 'sales':
      sections.push(await safeBuild('Продажи по дням', () => buildSalesSection(args)))
      break
    case 'orders':
      sections.push(await safeBuild('Список заказов', () => buildOrdersSection(args)))
      break
    case 'menu_items':
      sections.push(await safeBuild('Блюда меню и продажи', () => buildMenuItemsSection(args)))
      break
    case 'customers':
      sections.push(await safeBuild('Активные клиенты', () => buildCustomersSection(args)))
      break
    case 'popular_items':
      sections.push(await safeBuild('Топ популярных блюд', () => buildPopularItemsSection(args)))
      break
    case 'full':
      sections.push(await safeBuild('Продажи по дням', () => buildSalesSection(args)))
      sections.push(await safeBuild('Топ популярных блюд', () => buildPopularItemsSection(args)))
      sections.push(await safeBuild('Активные клиенты', () => buildCustomersSection(args)))
      sections.push(await safeBuild('Список заказов', () => buildOrdersSection(args)))
      break
  }

  return {
    title: REPORT_TYPE_LABELS[args.type],
    branchName: args.branchName,
    period: args.period,
    generatedAt: new Date(),
    sections,
  }
}
