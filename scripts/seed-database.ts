import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Создаем админа
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'nerflmntrix@gmail.com' },
    update: {},
    create: {
      email: 'nerflmntrix@gmail.com',
      fullName: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
      status: 'active',
    },
  })
  console.log('✅ Админ создан:', admin.email)

  // Создаем пользователя филиала
  const branchPassword = await bcrypt.hash('branch123', 10)
  const branchUser = await prisma.user.upsert({
    where: { email: 'mokov208@gmail.com' },
    update: {},
    create: {
      email: 'mokov208@gmail.com',
      fullName: 'Branch Manager',
      passwordHash: branchPassword,
      role: 'branch',
      status: 'active',
    },
  })
  console.log('✅ Менеджер филиала создан:', branchUser.email)

  // Создаем обычного пользователя
  const customerPassword = await bcrypt.hash('password123', 10)
  const customer = await prisma.user.upsert({
    where: { email: 'betaomegaalfa02@gmail.com' },
    update: {},
    create: {
      email: 'betaomegaalfa02@gmail.com',
      fullName: 'Mukhamed Oskonaliev',
      passwordHash: customerPassword,
      role: 'customer',
      status: 'active',
    },
  })
  console.log('✅ Клиент создан:', customer.email)

  console.log('\n🎉 База данных успешно заполнена!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
