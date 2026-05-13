import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('🗑️  Удаление всех филиалов...\n');

  try {
    // Получаем все филиалы
    const branches = await prisma.branch.findMany({
      include: {
        branchUsers: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`📍 Найдено филиалов: ${branches.length}\n`);

    if (branches.length === 0) {
      console.log('✅ Филиалов нет, удалять нечего.');
      return;
    }

    // Показываем список филиалов
    branches.forEach((branch, index) => {
      console.log(`${index + 1}. ${branch.name}`);
      if (branch.branchUsers.length > 0) {
        branch.branchUsers.forEach(bu => {
          console.log(`   👤 Пользователь: ${bu.user.email} (${bu.user.role})`);
        });
      }
    });

    console.log('\n🔄 Начинаем удаление...\n');

    // Сначала удаляем все заказы
    console.log('📦 Удаляем заказы...');
    const ordersDeleted = await prisma.order.deleteMany({});
    console.log(`   ✅ Удалено заказов: ${ordersDeleted.count}`);

    // Удаляем пользователей филиалов
    for (const branch of branches) {
      if (branch.branchUsers.length > 0) {
        for (const branchUser of branch.branchUsers) {
          // Удаляем пользователя (BranchUser удалится каскадно)
          await prisma.user.delete({
            where: { id: branchUser.userId }
          });
          console.log(`   ✅ Удалён пользователь: ${branchUser.user.email}`);
        }
      }
    }

    // Удаляем все филиалы (связанные данные удалятся каскадно)
    const deleteResult = await prisma.branch.deleteMany({});
    
    console.log(`\n✅ Успешно удалено филиалов: ${deleteResult.count}`);
    console.log('✅ Все связанные пользователи также удалены');
    console.log('\n🎉 Готово! Теперь можно создавать новые филиалы.');

  } catch (error) {
    console.error('❌ Ошибка при удалении:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
