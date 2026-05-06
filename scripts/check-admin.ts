import { prisma } from "../lib/prisma";

async function checkAdmin() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "admin",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    console.log("📊 Найдено админов:", admins.length);
    console.log("\n👥 Список админов:");
    admins.forEach((admin) => {
      console.log(`\n  Email: ${admin.email}`);
      console.log(`  Имя: ${admin.fullName}`);
      console.log(`  Роль: ${admin.role}`);
      console.log(`  Статус: ${admin.status}`);
      console.log(`  Есть пароль: ${admin.passwordHash ? "✅ Да" : "❌ Нет"}`);
    });

    // Проверяем настройки Telegram
    const telegramSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["ADMIN_TELEGRAM_USER_ID", "ADMIN_TELEGRAM_BOT_TOKEN"],
        },
      },
    });

    console.log("\n📱 Настройки Telegram:");
    telegramSettings.forEach((setting) => {
      console.log(`  ${setting.key}: ${setting.value ? "✅ Установлено" : "❌ Не установлено"}`);
    });
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
