import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const password = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'betaomegaalfa02@gmail.com',
      fullName: 'Mukhamed Oskonaliev',
      passwordHash: password,
      role: 'customer',
      status: 'active',
    },
  })

  console.log('✅ Пользователь создан:')
  console.log(`  Email: ${user.email}`)
  console.log(`  ID: ${user.id}`)
  console.log(`  Роль: ${user.role}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
