import * as dotenv from 'dotenv';
import { prisma } from "../lib/prisma";

// Load .env file
dotenv.config();

async function listAdmins() {
  console.log("=== Список администраторов ===\n");

  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
      },
    });

    if (admins.length === 0) {
      console.log("❌ Администраторы не найдены!");
      console.log("\nДля создания администратора выполните:");
      console.log("npm run create-admin");
      return;
    }

    console.log(`Найдено администраторов: ${admins.length}\n`);

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.fullName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Статус: ${admin.status}`);
      console.log(`   Создан: ${admin.createdAt.toLocaleString()}`);
      console.log("");
    });

    // Проверяем настройки Telegram
    const telegramSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["ADMIN_TELEGRAM_USER_ID", "ADMIN_TELEGRAM_BOT_TOKEN"],
        },
      },
    });

    console.log("=== Настройки Telegram ===");
    if (telegramSettings.length === 0) {
      console.log("❌ Telegram не настроен!");
      console.log("\nДля настройки Telegram добавьте в таблицу system_settings:");
      console.log("1. ADMIN_TELEGRAM_USER_ID - ваш Telegram User ID");
      console.log("2. ADMIN_TELEGRAM_BOT_TOKEN - токен бота");
    } else {
      telegramSettings.forEach((setting) => {
        const value = setting.key === "ADMIN_TELEGRAM_BOT_TOKEN" 
          ? "***" + setting.value.slice(-4) 
          : setting.value;
        console.log(`✅ ${setting.key}: ${value}`);
      });
    }
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();
