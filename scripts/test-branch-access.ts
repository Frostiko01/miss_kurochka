import { prisma } from "../lib/prisma";

async function testBranchAccess() {
  try {
    console.log("🔍 Проверка доступа к филиалам...\n");

    // Получаем всех пользователей филиалов
    const branchUsers = await prisma.user.findMany({
      where: {
        role: "branch",
      },
      include: {
        branchUsers: {
          include: {
            branch: true,
          },
        },
      },
    });

    console.log(`✅ Найдено пользователей филиалов: ${branchUsers.length}\n`);

    for (const user of branchUsers) {
      const branchInfo = user.branchUsers[0];
      console.log("👤 Пользователь:");
      console.log(`   Email: ${user.email}`);
      console.log(`   Имя: ${user.fullName}`);
      console.log(`   Роль: ${user.role}`);
      console.log(`   Статус: ${user.status}`);
      if (branchInfo) {
        console.log(`   Филиал: ${branchInfo.branch.name}`);
        console.log(`   Филиал ID: ${branchInfo.branchId}`);
      } else {
        console.log(`   Филиал: Не назначен`);
      }
      console.log("");
    }

    // Проверяем филиалы
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: {
            branchUsers: true,
          },
        },
      },
    });

    console.log(`\n🏢 Найдено филиалов: ${branches.length}\n`);

    for (const branch of branches) {
      console.log(`📍 Филиал: ${branch.name}`);
      console.log(`   ID: ${branch.id}`);
      console.log(`   Адрес: ${branch.address}`);
      console.log(`   Пользователей: ${branch._count.branchUsers}`);
      console.log(`   Статус: ${branch.status}`);
      console.log("");
    }

    console.log("\n✅ Проверка завершена!");
    console.log("\n💡 Для входа используйте:");
    console.log("   URL: http://localhost:3000/branch/signin");
    console.log("   Email: любой из перечисленных выше");
    console.log("   Пароль: 123456");
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testBranchAccess();
