import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/menu/popular?limit=6
// Возвращает блюда отсортированные по частоте заказов (за последние 30 дней)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '6')

    // Считаем частоту заказов за последние 30 дней
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Группируем по menuItemId и суммируем quantity
    const stats = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        menuItemId: { not: null },
        order: {
          status: { in: ['completed', 'preparing', 'ready', 'delivering', 'confirmed'] },
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    })

    const ids = stats
      .map((s) => s.menuItemId)
      .filter((id): id is string => !!id)

    let items: any[] = []
    if (ids.length > 0) {
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: ids }, isActive: true },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { isPrimary: 'desc' } },
          sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          spices: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          modifiers: {
            include: {
              modifierGroup: {
                include: {
                  options: { where: { isActive: true }, orderBy: { priceDelta: 'asc' } },
                },
              },
            },
          },
        },
      })

      // Сохраняем порядок по статистике
      const orderMap = new Map(ids.map((id, i) => [id, i]))
      items = menuItems
        .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
        .map((item: any) => ({
          ...item,
          sizes: item.sizes.map((s: any) => ({ ...s, price: Number(s.price) })),
          spices: item.spices.map((sp: any) => ({ ...sp, price: Number(sp.price) })),
          modifiers: item.modifiers.map((m: any) => ({
            id: m.id,
            group: {
              id: m.modifierGroup.id,
              name: m.modifierGroup.name,
              isRequired: m.modifierGroup.isRequired,
              selectionType: m.modifierGroup.selectionType,
              options: m.modifierGroup.options.map((o: any) => ({
                ...o,
                priceDelta: Number(o.priceDelta),
              })),
            },
          })),
        }))
    }

    // Фоллбэк: если нет статистики — берём featured + новые
    if (items.length < limit) {
      const fallback = await prisma.menuItem.findMany({
        where: {
          isActive: true,
          NOT: { id: { in: ids } },
        },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { isPrimary: 'desc' } },
          sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          spices: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: [{ isFeatured: 'desc' }, { isNew: 'desc' }, { createdAt: 'desc' }],
        take: limit - items.length,
      })

      const fallbackNormalized = fallback.map((item: any) => ({
        ...item,
        sizes: item.sizes.map((s: any) => ({ ...s, price: Number(s.price) })),
        spices: item.spices.map((sp: any) => ({ ...sp, price: Number(sp.price) })),
        modifiers: [],
      }))

      items = [...items, ...fallbackNormalized]
    }

    const response = NextResponse.json({ items })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('popular menu error:', error)
    return NextResponse.json({ error: 'Failed to fetch popular items' }, { status: 500 })
  }
}
