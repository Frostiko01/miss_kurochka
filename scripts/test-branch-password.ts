/**
 * Тестирует вход филиалов с паролем 123123
 * Запуск: npx tsx scripts/test-branch-password.ts
 */
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

const TEST_PASSWORD = '123123'

async function main() {
  console.log('🔐 Тестирование входа для всех филиалов с паролем:', TEST_PASSWORD)
  console.log('=' .repeat(60))

  const branchUsers = await prisma.user.findMany({
    where: { role: 'branch' },
    select: { id: true, email: true, fullName: true, passwordHash: true },
  })

  if (branchUsers.length === 0) {
    console.log('❌ Не найдено пользователей с ролью branch.')
    await prisma.$disconnect()
    return
  }

  console.log(`\nНайдено филиалов: ${branchUsers.length}\n`)

  for (const user of branchUsers) {
    const email = user.email || 'без email'
    const isValid = user.passwordHash 
      ? await bcrypt.compare(TEST_PASSWORD, user.passwordHash)
      : false

    if (isValid) {
      console.log(`✅ ${user.fullName} (${email})`)
      console.log(`   Логин: ${email}`)
      console.log(`   Пароль: ${TEST_PASSWORD}`)
      console.log('')
    } else {
      console.log(`❌ ${user.fullName} (${email}) - пароль НЕ совпадает!`)
      console.log('')
    }
  }

  console.log('=' .repeat(60))
  console.log('✅ Тестирование завершено!')
  console.log('\n📍 URL для входа филиалов: http://localhost:3000/branch/signin')
  
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Ошибка:', e)
  process.exit(1)
})
