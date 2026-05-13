import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function testBranchLogin() {
  try {
    const email = 'mokov208@gmail.com'; // Используем первый email из списка
    
    console.log('🔍 Тестирование входа для:', email);
    console.log('');

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branchUsers: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ Пользователь не найден!');
      return;
    }

    console.log('✅ Пользователь найден:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Имя:', user.fullName);
    console.log('   Роль:', user.role);
    console.log('   Статус:', user.status);
    console.log('   Есть пароль:', user.passwordHash ? 'Да' : 'Нет');
    console.log('');

    if (user.branchUsers.length > 0) {
      console.log('✅ Связанные филиалы:');
      user.branchUsers.forEach((bu) => {
        console.log(`   - ${bu.branch.name} (ID: ${bu.branch.id})`);
      });
    } else {
      console.log('⚠️ Пользователь не связан ни с одним филиалом!');
    }
    console.log('');

    // Проверяем, что роль именно "branch"
    if (user.role !== 'branch') {
      console.log('❌ ПРОБЛЕМА: Роль пользователя не "branch", а "' + user.role + '"');
      console.log('   Это объясняет, почему перенаправляет на главную!');
      console.log('');
      console.log('🔧 РЕШЕНИЕ: Обновить роль пользователя на "branch"');
      
      const answer = 'yes'; // Автоматически исправляем
      
      if (answer === 'yes') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'branch' },
        });
        console.log('✅ Роль обновлена на "branch"');
      }
    } else {
      console.log('✅ Роль корректная: "branch"');
    }
    console.log('');

    console.log('📝 Для входа используйте:');
    console.log('   URL: http://localhost:3000/branch/signin');
    console.log('   Email:', email);
    console.log('   Пароль: (пароль который вы указали при создании)');
    console.log('');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBranchLogin();
