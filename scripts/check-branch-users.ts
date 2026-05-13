import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function checkBranchUsers() {
  try {
    console.log('🔍 Проверка пользователей филиалов...\n');

    // Получаем всех пользователей с ролью branch
    const branchUsers = await prisma.user.findMany({
      where: {
        role: 'branch',
      },
      include: {
        branchUsers: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (branchUsers.length === 0) {
      console.log('❌ Пользователей филиалов не найдено!');
      console.log('\n📝 Создайте филиал через админ-панель:');
      console.log('   1. Перейдите на http://localhost:3000/admin/branches');
      console.log('   2. Нажмите "Добавить филиал"');
      console.log('   3. Заполните все поля включая Email и Пароль');
      console.log('   4. Нажмите "Добавить филиал"\n');
      return;
    }

    console.log(`✅ Найдено пользователей филиалов: ${branchUsers.length}\n`);

    branchUsers.forEach((user, index) => {
      console.log(`\n📋 Пользователь ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Имя: ${user.fullName}`);
      console.log(`   Роль: ${user.role}`);
      console.log(`   Статус: ${user.status}`);
      console.log(`   Есть пароль: ${user.passwordHash ? '✅ Да' : '❌ Нет'}`);
      
      if (user.branchUsers.length > 0) {
        console.log(`   Связанные филиалы:`);
        user.branchUsers.forEach((bu) => {
          console.log(`      - ${bu.branch.name} (${bu.branch.status})`);
        });
      } else {
        console.log(`   ⚠️ Не связан ни с одним филиалом`);
      }
    });

    console.log('\n\n🔐 Для входа используйте:');
    console.log('   URL: http://localhost:3000/branch/signin');
    console.log('   Email: (один из email выше)');
    console.log('   Пароль: (пароль который вы указали при создании)\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranchUsers();
