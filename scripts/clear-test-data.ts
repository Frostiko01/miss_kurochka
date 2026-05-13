/**
 * Скрипт для очистки тестовых данных из БД
 * Сохраняет структуру, удаляет только данные
 */

import { prisma } from '../lib/prisma'

async function main() {
  console.log('🧹 Начинаем очистку тестовых данных...\n')

  try {
    // Удаляем в правильном порядке (учитывая foreign keys)
    
    console.log('📦 Очистка корзин и заказов...')
    await prisma.cartItemModifier.deleteMany({})
    await prisma.cartItem.deleteMany({})
    await prisma.cart.deleteMany({})
    
    await prisma.orderItemModifier.deleteMany({})
    await prisma.orderItem.deleteMany({})
    await prisma.payment.deleteMany({})
    await prisma.order.deleteMany({})
    console.log('✅ Корзины и заказы очищены')

    console.log('\n🍔 Очистка меню...')
    await prisma.stopList.deleteMany({})
    await prisma.menuItemModifier.deleteMany({})
    await prisma.menuItemImage.deleteMany({})
    await prisma.menuItem.deleteMany({})
    await prisma.menuCategory.deleteMany({})
    console.log('✅ Меню очищено')

    console.log('\n⚙️ Очистка модификаторов...')
    await prisma.modifierOption.deleteMany({})
    await prisma.modifierGroup.deleteMany({})
    console.log('✅ Модификаторы очищены')

    console.log('\n🎁 Очистка комбо и дополнительных предложений...')
    await prisma.comboOffer.deleteMany({})
    await prisma.additionalOffer.deleteMany({})
    console.log('✅ Комбо и доп. предложения очищены')

    console.log('\n🎯 Очистка маркетинга...')
    await prisma.banner.deleteMany({})
    console.log('✅ Баннеры очищены')

    console.log('\n🚚 Очистка доставки...')
    await prisma.deliveryAddress.deleteMany({})
    await prisma.deliveryZone.deleteMany({})
    console.log('✅ Адреса и зоны доставки очищены')

    console.log('\n📊 Очистка аналитики...')
    await prisma.popularItemsStats.deleteMany({})
    console.log('✅ Статистика очищена')

    console.log('\n🏢 Очистка филиалов...')
    await prisma.branchUser.deleteMany({})
    await prisma.branchSchedule.deleteMany({})
    await prisma.branch.deleteMany({})
    console.log('✅ Филиалы очищены')

    console.log('\n👤 Очистка пользователей (кроме админов)...')
    // Удаляем только customer и branch пользователей, оставляем админов
    await prisma.account.deleteMany({
      where: {
        user: {
          role: {
            in: ['customer', 'branch']
          }
        }
      }
    })
    await prisma.session.deleteMany({
      where: {
        user: {
          role: {
            in: ['customer', 'branch']
          }
        }
      }
    })
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          in: ['customer', 'branch']
        }
      }
    })
    console.log(`✅ Удалено ${deletedUsers.count} пользователей (админы сохранены)`)

    console.log('\n🔐 Очистка кодов верификации...')
    await prisma.verificationCode.deleteMany({})
    console.log('✅ Коды верификации очищены')

    console.log('\n✨ Очистка завершена успешно!')
    console.log('\n📋 Что осталось:')
    console.log('  - Структура БД (таблицы, колонки)')
    console.log('  - Админ пользователи')
    console.log('  - Системные настройки')
    
  } catch (error) {
    console.error('\n❌ Ошибка при очистке:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
