import { prisma } from '../lib/prisma'

async function checkMenuData() {
  try {
    console.log('=== Проверка данных меню ===\n')

    // Проверяем категории
    const categories = await prisma.menuCategory.findMany({
      include: {
        branch: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`📁 Всего категорий: ${categories.length}`)
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.type}) - ${cat.branchId ? `Филиал: ${cat.branch?.name}` : 'Глобальная'} - Статус: ${cat.status}`)
    })
    console.log()

    // Проверяем блюда
    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: {
          select: {
            name: true,
            branchId: true
          }
        },
        images: true
      }
    })
    
    console.log(`🍗 Всего блюд: ${menuItems.length}`)
    menuItems.forEach(item => {
      console.log(`  - ${item.name} (${item.category.name}) - ${item.price} сом - Активно: ${item.isActive} - Изображений: ${item.images.length}`)
    })
    console.log()

    // Проверяем активные блюда в активных категориях
    const activeCategories = categories.filter(c => c.status === 'active')
    const activeCategoryIds = activeCategories.map(c => c.id)
    const activeItems = menuItems.filter(item => 
      item.isActive && activeCategoryIds.includes(item.categoryId)
    )
    
    console.log(`✅ Активных категорий: ${activeCategories.length}`)
    console.log(`✅ Активных блюд в активных категориях: ${activeItems.length}`)
    console.log()

    // Проверяем филиалы
    const branches = await prisma.branch.findMany()
    console.log(`🏢 Всего филиалов: ${branches.length}`)
    branches.forEach(branch => {
      console.log(`  - ${branch.name} (${branch.address})`)
    })

  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMenuData()
