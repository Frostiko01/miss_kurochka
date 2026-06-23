/**
 * Устанавливает единый пароль для всех пользователей-филиалов (role = branch).
 * Запуск: npx tsx scripts/set-branch-password.ts
 */
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

const NEW_PASSWORD = '123123'

async function main() {
  const branchUsers = await prisma.user.findMany({
    where: { role: 'branch' },
    select: { id: true, email: true, fullName: true },
  })

  console.log(`Найдено пользователей-филиалов: ${branchUsers.length}\n`)

  if (branchUsers.length === 0) {
    console.log('Нет пользователей с ролью branch.')
    await prisma.$disconnect()
    return
  }

  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10)

  for (const u of branchUsers) {
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash },
    })
    console.log(`✅ ${u.fullName} (${u.email ?? 'без email'}) — пароль обновлён`)
  }

  console.log(`\nГотово. Пароль "${NEW_PASSWORD}" установлен для ${branchUsers.length} филиал(ов).`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
