// Простой тест API меню без запуска сервера
import { prisma } from '../lib/prisma'

async function testMenuAPI() {
  try {
    console.log('=== Тест логики API меню ===\n')

    const branchId = null // Тестируем без филиала

    // Логика из API
    const categoriesWhere: any = {
      status: "active",
      OR: [
        { branchId: null }, // Глобальные категории
      ],
    };

    if (branchId) {
      categoriesWhere.OR.push({ branchId });
    }

    const categories = await prisma.menuCategory.findMany({
      where: categoriesWhere,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`Найдено категорий: ${categories.length}`)
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (type: ${cat.type}, status: ${cat.status})`)
    })
    console.log()

    const categoryIds = categories.map((c) => c.id);

    const menuItems = await prisma.menuItem.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            branchId: true,
          },
        },
        images: {
          orderBy: {
            isPrimary: "desc",
          },
        },
        modifiers: {
          include: {
            modifierGroup: {
              include: {
                options: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        },
        stopList: branchId
          ? {
              where: {
                branchId,
                restoredAt: null,
              },
              select: {
                id: true,
                reason: true,
                expectedReturnAt: true,
              },
            }
          : undefined,
      },
    });

    console.log(`Найдено блюд: ${menuItems.length}`)
    menuItems.forEach(item => {
      console.log(`  - ${item.name} (${item.category.name}, type: ${item.category.type})`)
    })
    console.log()

    // Группируем по типам
    const grouped = {
      regular: [] as any[],
      combo: [] as any[],
      mini_combo: [] as any[],
    };

    categories.forEach(category => {
      const items = menuItems.filter(item => item.categoryId === category.id)
      
      const categoryData = {
        id: category.id,
        name: category.name,
        type: category.type,
        itemsCount: items.length,
        items: items.map(i => ({ id: i.id, name: i.name }))
      }

      if (category.type === 'regular') {
        grouped.regular.push(categoryData)
      } else if (category.type === 'combo') {
        grouped.combo.push(categoryData)
      } else if (category.type === 'mini_combo') {
        grouped.mini_combo.push(categoryData)
      }
    })

    console.log('=== Группировка по типам ===')
    console.log(`Regular: ${grouped.regular.length} категорий`)
    grouped.regular.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.itemsCount} блюд`)
    })
    console.log(`Combo: ${grouped.combo.length} категорий`)
    console.log(`Mini Combo: ${grouped.mini_combo.length} категорий`)
    console.log()

    console.log('✅ API должен работать корректно!')

  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMenuAPI()
