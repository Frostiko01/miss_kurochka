import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API для Smart Hero Banner
 * Автоматически выбирает популярные товары из базы данных
 * GET /api/smart-banner
 */
export async function GET() {
  try {
    // Получаем товары по приоритету:
    // 1. Самые заказываемые за последние 7 дней
    // 2. Самые продаваемые за 30 дней
    // 3. Акционные товары (со старой ценой)
    // 4. Новинки (isNew)
    // 5. Популярные (isFeatured)

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Получаем статистику за последние 7 дней
    const recentStats = await prisma.popularItemsStats.groupBy({
      by: ['menuItemId'],
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      _sum: {
        quantitySold: true,
        orderCount: true,
      },
      orderBy: {
        _sum: {
          orderCount: 'desc',
        },
      },
      take: 10,
    });

    // Получаем статистику за последние 30 дней
    const monthStats = await prisma.popularItemsStats.groupBy({
      by: ['menuItemId'],
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        quantitySold: true,
        orderCount: true,
      },
      orderBy: {
        _sum: {
          orderCount: 'desc',
        },
      },
      take: 10,
    });

    // Объединяем ID популярных товаров
    const popularIds = new Set([
      ...recentStats.map((s) => s.menuItemId),
      ...monthStats.map((s) => s.menuItemId),
    ]);

    // Получаем данные товаров
    const items = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        OR: [
          // Популярные по статистике
          { id: { in: Array.from(popularIds) } },
          // Новинки
          { isNew: true },
          // Избранные
          { isFeatured: true },
        ],
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        sizes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 20,
    });

    // Также получаем комбо с акциями
    const combos = await prisma.comboOffer.findMany({
      where: {
        isActive: true,
        oldPrice: { not: null },
      },
      orderBy: { sortOrder: 'asc' },
      take: 5,
    });

    // Формируем список баннеров
    const bannerItems = [];

    // 1. Популярные товары из статистики (приоритет 1)
    const statsBasedItems = items
      .filter((item) => popularIds.has(item.id))
      .sort((a, b) => {
        const aStats = recentStats.find((s) => s.menuItemId === a.id);
        const bStats = recentStats.find((s) => s.menuItemId === b.id);
        return (
          (bStats?._sum?.orderCount ?? 0) - (aStats?._sum?.orderCount ?? 0)
        );
      })
      .slice(0, 3);

    // 2. Комбо с акциями (приоритет 2)
    const promoCombos = combos.slice(0, 2).map((combo) => ({
      id: combo.id,
      type: 'combo' as const,
      name: combo.name,
      description: combo.description || 'Выгодное предложение',
      image: combo.imageUrl,
      price: Number(combo.price),
      oldPrice: combo.oldPrice ? Number(combo.oldPrice) : null,
      discount: combo.oldPrice
        ? Math.round(
            ((Number(combo.oldPrice) - Number(combo.price)) /
              Number(combo.oldPrice)) *
              100
          )
        : 0,
    }));

    // 3. Новинки (приоритет 3)
    const newItems = items
      .filter((item) => item.isNew)
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        type: 'menu_item' as const,
        name: item.name,
        description: item.description || 'Новинка в меню',
        image: item.images[0]?.imageUrl || null,
        price: item.sizes[0] ? Number(item.sizes[0].price) : 0,
        oldPrice: null,
        discount: 0,
        badge: 'Новинка',
      }));

    // 4. Избранные товары (приоритет 4)
    const featuredItems = items
      .filter((item) => item.isFeatured && !item.isNew)
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        type: 'menu_item' as const,
        name: item.name,
        description: item.description || 'Хит продаж',
        image: item.images[0]?.imageUrl || null,
        price: item.sizes[0] ? Number(item.sizes[0].price) : 0,
        oldPrice: null,
        discount: 0,
        badge: 'Хит',
      }));

    // Добавляем товары из статистики
    for (const item of statsBasedItems) {
      bannerItems.push({
        id: item.id,
        type: 'menu_item' as const,
        name: item.name,
        description: item.description || 'Самое популярное',
        image: item.images[0]?.imageUrl || null,
        price: item.sizes[0] ? Number(item.sizes[0].price) : 0,
        oldPrice: null,
        discount: 0,
        badge: 'Популярное',
      });
    }

    // Добавляем комбо
    bannerItems.push(...promoCombos);

    // Добавляем новинки
    bannerItems.push(...newItems);

    // Добавляем избранные
    bannerItems.push(...featuredItems);

    // Если ничего не нашли, берем случайные активные товары
    if (bannerItems.length === 0) {
      const randomItems = await prisma.menuItem.findMany({
        where: {
          isActive: true,
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          sizes: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      bannerItems.push(
        ...randomItems.map((item) => ({
          id: item.id,
          type: 'menu_item' as const,
          name: item.name,
          description: item.description || 'Попробуйте наше блюдо',
          image: item.images[0]?.imageUrl || null,
          price: item.sizes[0] ? Number(item.sizes[0].price) : 0,
          oldPrice: null,
          discount: 0,
        }))
      );
    }

    // Ограничиваем до 5 баннеров
    const finalBanners = bannerItems.slice(0, 5);

    return NextResponse.json({
      banners: finalBanners,
      success: true,
    });
  } catch (error) {
    console.error('Smart Banner API Error:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки баннеров', success: false },
      { status: 500 }
    );
  }
}
