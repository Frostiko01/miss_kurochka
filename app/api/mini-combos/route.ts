import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/mini-combos — публичный список активных мини-комбо
export async function GET() {
  try {
    const combos = await prisma.comboOffer.findMany({
      where: { isActive: true, type: 'mini' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        oldPrice: true,
        imageUrl: true,
        sortOrder: true,
        comboItems: {
          orderBy: { sortOrder: 'asc' },
          select: {
            quantity: true,
            menuItem: { select: { id: true, name: true } },
          },
        },
      },
    })

    const normalized = combos.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price: Number(c.price),
      oldPrice: c.oldPrice ? Number(c.oldPrice) : null,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      items: c.comboItems.map((ci) => ci.menuItem.name),
    }))

    const response = NextResponse.json({ combos: normalized })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('mini-combos GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch mini combos' }, { status: 500 })
  }
}
