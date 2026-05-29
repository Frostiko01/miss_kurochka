import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      passwordHash: true,
    }
  })

  if (!admin) {
    console.log('❌ Администратор не найден в базе данных!')
    return
  }

  console.log('Администратор найден:')
  console.log('  Email:', admin.email)
  console.log('  Имя:', admin.fullName)
  console.log('  Роль:', admin.role)
  console.log('  Статус:', admin.status)
  console.log('  Есть пароль:', !!admin.passwordHash)

  if (admin.passwordHash) {
    // Проверяем несколько распространённых паролей
    const testPasswords = ['admin', 'admin123', '123456', 'password', 'Admin123', 'misskurochka']
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, admin.passwordHash)
      if (match) {
        console.log(`\n✅ Пароль найден: "${pwd}"`)
        return
      }
    }
    console.log('\n⚠️  Пароль не совпадает ни с одним из стандартных.')
    console.log('   Хэш пароля:', admin.passwordHash.substring(0, 30) + '...')
    console.log('\n💡 Нужно сбросить пароль. Запустите:')
    console.log('   npx tsx scripts/reset-admin-password.ts')
  } else {
    console.log('\n❌ У администратора нет пароля!')
    console.log('   Нужно установить пароль. Запустите:')
    console.log('   npx tsx scripts/reset-admin-password.ts')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
