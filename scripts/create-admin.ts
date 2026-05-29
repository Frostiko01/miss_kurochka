/**
 * Создание или обновление администратора
 * Использование:
 *   npx tsx scripts/create-admin.ts
 *
 * Или с параметрами через env:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=mypassword npx tsx scripts/create-admin.ts
 */

import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@misskurochka.kg'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'
  const fullName = process.env.ADMIN_NAME || 'Администратор'

  console.log(`\n🔧 Создание/обновление администратора...`)
  console.log(`   Email: ${email}`)
  console.log(`   Имя: ${fullName}`)

  const passwordHash = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'admin',
      status: 'active',
      fullName,
    },
    create: {
      email,
      passwordHash,
      role: 'admin',
      status: 'active',
      fullName,
    },
  })

  console.log(`\n✅ Администратор готов:`)
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Пароль: ${password}`)
  console.log(`\n🔐 Войдите по адресу: /admin/signin`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
