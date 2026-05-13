import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function resetBranchPassword() {
  console.log('🔐 Сброс пароля для филиала...\n');

  try {
    // Получаем всех пользователей филиалов
    const branchUsers = await prisma.user.findMany({
      where: { role: 'branch' },
      include: {
        branchUsers: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (branchUsers.length === 0) {
      console.log('❌ Пользователи филиалов не найдены!');
      return;
    }

    console.log(`✅ Найдено пользователей филиалов: ${branchUsers.length}\n`);

    // Новый пароль
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль для всех пользователей филиалов
    for (const user of branchUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });

      console.log(`✅ Пароль обновлен для: ${user.email}`);
      console.log(`   Имя: ${user.fullName}`);
      if (user.branchUsers.length > 0) {
        console.log(`   Филиал: ${user.branchUsers[0].branch.name}`);
      }
      console.log(`   Новый пароль: ${newPassword}\n`);
    }

    console.log('🎉 Все пароли успешно обновлены!');
    console.log('\n💡 Теперь вы можете войти:');
    console.log('   URL: http://localhost:3000/branch/signin');
    console.log(`   Пароль для всех: ${newPassword}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

resetBranchPassword();
