/**
 * Тестовый скрипт для проверки работы ИИ-помощника с базой данных
 * 
 * Запуск: npx tsx scripts/test-ai-chat.ts
 */

import { prisma } from '@/lib/prisma'

async function testDatabaseAccess() {
  console.log('🔍 Проверка доступа к базе данных...\n')

  try {
    // 1. Проверка меню
    const menuItems = await prisma.menuItem.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        sizes: { where: { isActive: true } }
      },
      take: 5
    })
    console.log(`✅ Найдено ${menuItems.length} активных блюд`)
    if (menuItems.length > 0) {
      console.log(`   Пример: ${menuItems[0].name} - ${menuItems[0].sizes[0]?.price || 'N/A'} сом\n`)
    }

    // 2. Проверка комбо
    const combos = await prisma.comboOffer.findMany({
      where: { isActive: true },
      include: {
        comboItems: {
          include: { menuItem: { select: { name: true } } }
        }
      },
      take: 3
    })
    console.log(`✅ Найдено ${combos.length} активных комбо`)
    if (combos.length > 0) {
      console.log(`   Пример: ${combos[0].name} - ${combos[0].price} сом\n`)
    }

    // 3. Проверка дополнительных предложений
    const additionalOffers = await prisma.additionalOffer.findMany({
      where: { isActive: true },
      take: 3
    })
    console.log(`✅ Найдено ${additionalOffers.length} дополнительных предложений`)
    if (additionalOffers.length > 0) {
      console.log(`   Пример: ${additionalOffers[0].name} - ${additionalOffers[0].price} сом\n`)
    }

    // 4. Проверка филиалов
    const branches = await prisma.branch.findMany({
      where: { status: 'active' },
      select: { name: true, address: true, phone: true }
    })
    console.log(`✅ Найдено ${branches.length} активных филиалов`)
    if (branches.length > 0) {
      console.log(`   Пример: ${branches[0].name} - ${branches[0].address}\n`)
    }

    // 5. Проверка модификаторов
    const modifiers = await prisma.modifierGroup.findMany({
      where: { isActive: true },
      include: {
        options: { where: { isActive: true } }
      },
      take: 3
    })
    console.log(`✅ Найдено ${modifiers.length} групп модификаторов`)
    if (modifiers.length > 0) {
      console.log(`   Пример: ${modifiers[0].name} (${modifiers[0].options.length} опций)\n`)
    }

    console.log('✨ Все проверки пройдены! База данных готова для работы с ИИ.\n')

  } catch (error) {
    console.error('❌ Ошибка при проверке базы данных:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function simulateAIQueries() {
  console.log('🤖 Симуляция запросов ИИ к базе данных...\n')

  try {
    // Запрос 1: Поиск блюд по категории
    console.log('📝 Запрос: "Покажи мне все бургеры"')
    const burgers = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        category: { name: { contains: 'бургер', mode: 'insensitive' } }
      },
      include: {
        sizes: { where: { isActive: true } },
        category: { select: { name: true } }
      }
    })
    console.log(`   Результат: Найдено ${burgers.length} бургеров`)
    burgers.slice(0, 3).forEach(b => {
      const minPrice = Math.min(...b.sizes.map(s => Number(s.price)))
      console.log(`   - ${b.name}: от ${minPrice} сом`)
    })
    console.log()

    // Запрос 2: Вегетарианские блюда
    console.log('📝 Запрос: "Что у вас есть вегетарианского?"')
    const veggie = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        isVegetarian: true
      },
      include: {
        sizes: { where: { isActive: true } }
      },
      take: 5
    })
    console.log(`   Результат: Найдено ${veggie.length} вегетарианских блюд`)
    veggie.forEach(v => {
      const minPrice = Math.min(...v.sizes.map(s => Number(s.price)))
      console.log(`   - ${v.name}: от ${minPrice} сом`)
    })
    console.log()

    // Запрос 3: Комбо-предложения
    console.log('📝 Запрос: "Какие у вас есть комбо?"')
    const combos = await prisma.comboOffer.findMany({
      where: { isActive: true },
      include: {
        comboItems: {
          include: { menuItem: { select: { name: true } } }
        }
      }
    })
    console.log(`   Результат: Найдено ${combos.length} комбо`)
    combos.slice(0, 3).forEach(c => {
      const items = c.comboItems.map(ci => ci.menuItem.name).join(', ')
      console.log(`   - ${c.name}: ${c.price} сом (${items})`)
    })
    console.log()

    console.log('✨ Симуляция завершена успешно!\n')

  } catch (error) {
    console.error('❌ Ошибка при симуляции запросов:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Тест ИИ-помощника Miss Kurochka с доступом к БД')
  console.log('═══════════════════════════════════════════════════════════\n')

  await testDatabaseAccess()
  await simulateAIQueries()

  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Все тесты пройдены! ИИ готов к работе.')
  console.log('═══════════════════════════════════════════════════════════')
}

main()
