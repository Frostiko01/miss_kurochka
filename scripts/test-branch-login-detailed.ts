import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function testBranchLogin() {
  console.log('🔍 Детальная проверка входа филиала...\n');

  try {
    // Получаем первого пользователя филиала
    const branchUser = await prisma.user.findFirst({
      where: { role: 'branch' },
      include: {
        branchUsers: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!branchUser) {
      console.log('❌ Пользователи филиалов не найдены!');
      return;
    }

    console.log('✅ Найден пользователь филиала:');
    console.log('   Email:', branchUser.email);
    console.log('   Имя:', branchUser.fullName);
    console.log('   Роль:', branchUser.role);
    console.log('   Статус:', branchUser.status);
    console.log('   Есть пароль:', !!branchUser.passwordHash);
    console.log('   Связан с филиалом:', branchUser.branchUsers.length > 0);
    
    if (branchUser.branchUsers.length > 0) {
      console.log('   Филиал:', branchUser.branchUsers[0].branch.name);
    }

    // Проверяем пароль
    console.log('\n🔐 Проверка пароля...');
    const testPassword = '123456'; // Попробуем стандартный пароль
    
    if (branchUser.passwordHash) {
      const isValid = await bcrypt.compare(testPassword, branchUser.passwordHash);
      console.log(`   Пароль "${testPassword}":`, isValid ? '✅ Верный' : '❌ Неверный');
      
      if (!isValid) {
        console.log('\n💡 Попробуйте другие пароли:');
        const commonPasswords = ['password', 'admin', '12345678', 'qwerty'];
        for (const pwd of commonPasswords) {
          const valid = await bcrypt.compare(pwd, branchUser.passwordHash);
          if (valid) {
            console.log(`   ✅ Пароль "${pwd}" подходит!`);
            break;
          }
        }
      }
    }

    // Проверяем структуру данных
    console.log('\n📊 Структура данных:');
    console.log('   ID:', branchUser.id);
    console.log('   Email:', branchUser.email);
    console.log('   Role:', branchUser.role);
    console.log('   Status:', branchUser.status);
    console.log('   PasswordHash exists:', !!branchUser.passwordHash);
    console.log('   PasswordHash length:', branchUser.passwordHash?.length || 0);

    // Проверяем связь с филиалом
    if (branchUser.branchUsers.length > 0) {
      const branchLink = branchUser.branchUsers[0];
      console.log('\n🏢 Связь с филиалом:');
      console.log('   Branch ID:', branchLink.branchId);
      console.log('   Branch Name:', branchLink.branch.name);
      console.log('   Branch Status:', branchLink.branch.status);
    } else {
      console.log('\n⚠️ ПРОБЛЕМА: Пользователь не связан ни с одним филиалом!');
      console.log('   Это может быть причиной проблем с входом.');
    }

    // Рекомендации
    console.log('\n💡 Для входа используйте:');
    console.log('   URL: http://localhost:3000/branch/signin');
    console.log('   Email:', branchUser.email);
    console.log('   Пароль: (тот который вы указали при создании)');
    
    console.log('\n📝 Если не помните пароль, можно сбросить его через скрипт:');
    console.log('   npx tsx scripts/reset-branch-password.ts');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testBranchLogin();
