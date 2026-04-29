import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Создаем администратора
  const admin = await prisma.user.upsert({
    where: { email: 'admin@misskurochka.kg' },
    update: {},
    create: {
      email: 'admin@misskurochka.kg',
      username: 'admin',
      fullName: 'Администратор системы',
      role: 'admin',
      passwordHash: '$2a$10$example.hash.here', // В реальности используйте bcrypt
      isActive: true,
    },
  })
  console.log('✅ Создан администратор:', admin.email)

  // Создаем главный филиал
  const mainBranch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Miss Kurochka - Центр',
      address: 'ул. Чуй 123, Бишкек',
      phone: '+996555123456',
      email: 'center@misskurochka.kg',
      city: 'Bishkek',
      latitude: 42.8746,
      longitude: 74.5698,
      status: 'active',
      averageCookingTime: 20,
      minOrderAmount: 200,
      description: 'Главный филиал в центре города',
    },
  })
  console.log('✅ Создан филиал:', mainBranch.name)

  // Создаем график работы (Пн-Вс 9:00-22:00)
  for (let day = 0; day < 7; day++) {
    await prisma.branchSchedule.upsert({
      where: { 
        id: `schedule-${day}` 
      },
      update: {},
      create: {
        id: `schedule-${day}`,
        branchId: mainBranch.id,
        dayOfWeek: day,
        openTime: new Date('1970-01-01T09:00:00Z'),
        closeTime: new Date('1970-01-01T22:00:00Z'),
      },
    })
  }
  console.log('✅ Создан график работы')

  // Создаем категории меню
  const categoryChicken = await prisma.menuCategory.create({
    data: {
      branchId: mainBranch.id,
      name: 'Курица',
      nameI18n: {
        ru: 'Курица',
        en: 'Chicken',
        ky: 'Тоок'
      },
      status: 'active',
    },
  })

  const categoryBurgers = await prisma.menuCategory.create({
    data: {
      branchId: mainBranch.id,
      name: 'Бургеры',
      nameI18n: {
        ru: 'Бургеры',
        en: 'Burgers',
        ky: 'Бургерлер'
      },
      status: 'active',
    },
  })

  const categoryDrinks = await prisma.menuCategory.create({
    data: {
      branchId: mainBranch.id,
      name: 'Напитки',
      nameI18n: {
        ru: 'Напитки',
        en: 'Drinks',
        ky: 'Суусундуктар'
      },
      status: 'active',
    },
  })
  console.log('✅ Созданы категории меню')

  // Создаем группы модификаторов
  const sauceGroup = await prisma.modifierGroup.create({
    data: {
      branchId: mainBranch.id,
      name: 'Выбор соуса',
      nameI18n: {
        ru: 'Выбор соуса',
        en: 'Choose sauce',
        ky: 'Соусту тандоо'
      },
      selectionType: 'single',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      options: {
        create: [
          { 
            name: 'Кетчуп', 
            nameI18n: { ru: 'Кетчуп', en: 'Ketchup', ky: 'Кетчуп' },
            priceDelta: 0, 
            isDefault: true 
          },
          { 
            name: 'Майонез', 
            nameI18n: { ru: 'Майонез', en: 'Mayonnaise', ky: 'Майонез' },
            priceDelta: 0 
          },
          { 
            name: 'Острый', 
            nameI18n: { ru: 'Острый', en: 'Spicy', ky: 'Ачуу' },
            priceDelta: 10 
          },
          { 
            name: 'Сырный', 
            nameI18n: { ru: 'Сырный', en: 'Cheese', ky: 'Сыр' },
            priceDelta: 20 
          },
        ]
      }
    },
    include: {
      options: true
    }
  })

  const extrasGroup = await prisma.modifierGroup.create({
    data: {
      branchId: mainBranch.id,
      name: 'Дополнительно',
      nameI18n: {
        ru: 'Дополнительно',
        en: 'Extras',
        ky: 'Кошумча'
      },
      selectionType: 'multiple',
      isRequired: false,
      minSelections: 0,
      maxSelections: 5,
      options: {
        create: [
          { 
            name: 'Сыр', 
            nameI18n: { ru: 'Сыр', en: 'Cheese', ky: 'Сыр' },
            priceDelta: 30 
          },
          { 
            name: 'Бекон', 
            nameI18n: { ru: 'Бекон', en: 'Bacon', ky: 'Бекон' },
            priceDelta: 50 
          },
          { 
            name: 'Огурцы', 
            nameI18n: { ru: 'Огурцы', en: 'Pickles', ky: 'Кыяр' },
            priceDelta: 15 
          },
        ]
      }
    },
    include: {
      options: true
    }
  })
  console.log('✅ Созданы группы модификаторов')

  // Создаем блюда
  const wings = await prisma.menuItem.create({
    data: {
      categoryId: categoryChicken.id,
      name: 'Куриные крылышки',
      nameI18n: {
        ru: 'Куриные крылышки',
        en: 'Chicken wings',
        ky: 'Тоок канаттары'
      },
      description: 'Хрустящие крылышки с пряностями',
      descriptionI18n: {
        ru: 'Хрустящие крылышки с пряностями',
        en: 'Crispy wings with spices',
        ky: 'Даамдуу татымдуу канаттар'
      },
      price: 350,
      weightGrams: 250,
      cookingTimeMinutes: 15,
      calories: 450,
      proteins: 28,
      fats: 32,
      carbohydrates: 12,
      spicyLevel: 2,
      isActive: true,
      isFeatured: true,
      modifiers: {
        create: [
          { modifierGroupId: sauceGroup.id, sortOrder: 1 }
        ]
      },
      images: {
        create: [
          { imageUrl: '/images/wings.jpg', isPrimary: true }
        ]
      }
    }
  })

  const burger = await prisma.menuItem.create({
    data: {
      categoryId: categoryBurgers.id,
      name: 'Чикен Бургер',
      nameI18n: {
        ru: 'Чикен Бургер',
        en: 'Chicken Burger',
        ky: 'Тоок Бургер'
      },
      description: 'Сочный бургер с куриной котлетой',
      descriptionI18n: {
        ru: 'Сочный бургер с куриной котлетой',
        en: 'Juicy burger with chicken patty',
        ky: 'Тоок котлетасы менен даамдуу бургер'
      },
      price: 280,
      weightGrams: 320,
      cookingTimeMinutes: 12,
      calories: 520,
      proteins: 32,
      fats: 24,
      carbohydrates: 48,
      spicyLevel: 1,
      isActive: true,
      isNew: true,
      modifiers: {
        create: [
          { modifierGroupId: sauceGroup.id, sortOrder: 1 },
          { modifierGroupId: extrasGroup.id, sortOrder: 2 }
        ]
      },
      images: {
        create: [
          { imageUrl: '/images/burger.jpg', isPrimary: true }
        ]
      }
    }
  })

  const cola = await prisma.menuItem.create({
    data: {
      categoryId: categoryDrinks.id,
      name: 'Кока-Кола',
      nameI18n: {
        ru: 'Кока-Кола',
        en: 'Coca-Cola',
        ky: 'Кока-Кола'
      },
      description: 'Освежающий напиток 0.5л',
      price: 80,
      volumeMl: 500,
      cookingTimeMinutes: 1,
      calories: 210,
      carbohydrates: 54,
      isActive: true,
      images: {
        create: [
          { imageUrl: '/images/cola.jpg', isPrimary: true }
        ]
      }
    }
  })
  console.log('✅ Созданы блюда')

  // Создаем зону доставки
  const deliveryZone = await prisma.deliveryZone.create({
    data: {
      branchId: mainBranch.id,
      name: 'Центр города',
      polygonCoordinates: {
        type: 'Polygon',
        coordinates: [[
          [74.5698, 42.8746],
          [74.5798, 42.8746],
          [74.5798, 42.8846],
          [74.5698, 42.8846],
          [74.5698, 42.8746]
        ]]
      },
      deliveryFee: 100,
      minOrderAmount: 300,
      estimatedMinutes: 30,
      isActive: true,
    }
  })
  console.log('✅ Создана зона доставки')

  // Создаем баннер
  const banner = await prisma.banner.create({
    data: {
      title: 'Открытие нового филиала!',
      subtitle: 'Скидка 20% на первый заказ',
      imageUrl: '/images/banner-opening.jpg',
      sortOrder: 1,
      isActive: true,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
      createdBy: admin.id,
    }
  })
  console.log('✅ Создан баннер')

  // Создаем системные настройки
  await prisma.systemSetting.upsert({
    where: { key: 'app.name' },
    update: {},
    create: {
      key: 'app.name',
      value: { ru: 'Miss Kurochka', en: 'Miss Kurochka', ky: 'Miss Kurochka' }
    }
  })

  await prisma.systemSetting.upsert({
    where: { key: 'app.currency' },
    update: {},
    create: {
      key: 'app.currency',
      value: { code: 'KGS', symbol: 'сом' }
    }
  })

  await prisma.systemSetting.upsert({
    where: { key: 'app.languages' },
    update: {},
    create: {
      key: 'app.languages',
      value: { default: 'ru', available: ['ru', 'en', 'ky'] }
    }
  })
  console.log('✅ Созданы системные настройки')

  console.log('🎉 Заполнение базы данных завершено!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
