import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/menu/by-ids?ids=id1,combo_id2,id3
 * Возвращает блюда и комбо-офферы по списку ID (для страницы избранного).
 * ID комбо-офферов хранятся с префиксом "combo_" в localStorage.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({ items: [] })
    }

    const rawIds = idsParam
      .split(',')
      .map(id => id.trim())
      .filter(Boolean)

    if (rawIds.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Разделяем на обычные блюда и комбо (префикс "combo_")
    const menuItemIds = rawIds.filter(id => !id.startsWith('combo_'))
    const comboIds = rawIds
      .filter(id => id.startsWith('combo_'))
      .map(id => id.replace(/^combo_/, ''))

    const results: any[] = []

    // Загружаем обычные блюда
    if (menuItemIds.length > 0) {
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, isActive: true },
        include: {
          images: { orderBy: { isPrimary: 'desc' } },
          sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          spices: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true, type: true } },
        },
      })

      for (const item of menuItems) {
        results.push({
          id: item.id,
          storageId: item.id,
          type: 'menuItem',
          name: item.name,
          description: item.description,
          price: item.sizes.length > 0 ? Number(item.sizes[0].price) : 0,
          isFeatured: item.isFeatured,
          isNew: item.isNew,
          images: item.images.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          })),
          sizes: item.sizes.map(s => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            weightGrams: s.weightGrams,
            sortOrder: s.sortOrder,
          })),
          spices: item.spices.map(sp => ({
            id: sp.id,
            name: sp.name,
            price: Number(sp.price),
            sortOrder: sp.sortOrder,
          })),
          category: item.category,
        })
      }
    }

    // Загружаем комбо-офферы
    if (comboIds.length > 0) {
      const combos = await prisma.comboOffer.findMany({
        where: { id: { in: comboIds }, isActive: true },
        include: {
          comboItems: {
            include: {
              menuItem: { select: { name: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })

      for (const combo of combos) {
        results.push({
          id: combo.id,
          storageId: `combo_${combo.id}`,
          type: 'combo',
          name: combo.name,
          description: combo.description,
          price: Number(combo.price),
          oldPrice: combo.oldPrice ? Number(combo.oldPrice) : null,
          isFeatured: false,
          isNew: false,
          // ComboOffer хранит imageUrl как строку, оборачиваем в массив для единого интерфейса
          images: combo.imageUrl
            ? [{ id: combo.id, imageUrl: combo.imageUrl, isPrimary: true }]
            : [],
          sizes: [],
          spices: [],
          category: null,
          comboItems: combo.comboItems.map(ci => ci.menuItem.name),
        })
      }
    }

    // Сохраняем порядок как в localStorage
    const ordered = rawIds
      .map(rawId => results.find(r => r.storageId === rawId))
      .filter(Boolean)

    return NextResponse.json({ items: ordered })
  } catch (error) {
    console.error('Error fetching items by ids:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}
