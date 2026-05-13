import { prisma } from '../lib/prisma'

async function fixCategoryTypes() {
  try {
    console.log('=== Обновление типов категорий ===\n')

    // Получаем все категории без типа или с undefined
    const categories = await prisma.menuCategory.findMany()
    
    console.log(`Найдено категорий: ${categories.length}\n`)

    for (const category of categories) {
      console.log(`Обновляем категорию: ${category.name}`)
      console.log(`  Текущий тип: ${category.type}`)
      
      // Если тип не установлен, устанавливаем 'regular'
      if (!category.type) {
        await prisma.menuCategory.update({
          where: { id: category.id },
          data: { type: 'regular' }
        })
        console.log(`  ✅ Установлен тип: regular\n`)
      } else {
        console.log(`  ℹ️  Тип уже установлен\n`)
      }
    }

    console.log('=== Проверка результатов ===\n')
    const updatedCategories = await prisma.menuCategory.findMany()
    updatedCategories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.type}`)
    })

    console.log('\n✅ Готово!')

  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCategoryTypes()
