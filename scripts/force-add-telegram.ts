import { prisma } from "../lib/prisma";
import * as dotenv from 'dotenv';

dotenv.config();

async function forceAddTelegram() {
  try {
    console.log("💾 Добавление настроек Telegram в базу данных...\n");

    const botToken = process.env.ADMIN_TELEGRAM_BOT_TOKEN;
    const userId = process.env.ADMIN_TELEGRAM_USER_ID;

    if (!botToken || !userId) {
      console.error("❌ Настройки не найдены в .env файле");
      return;
    }

    // Удаляем старые настройки если есть
    await prisma.systemSetting.deleteMany({
      where: {
        key: {
          in: ["ADMIN_TELEGRAM_USER_ID", "ADMIN_TELEGRAM_BOT_TOKEN"],
        },
      },
    });

    // Добавляем новые
    await prisma.systemSetting.create({
      data: {
        key: "ADMIN_TELEGRAM_USER_ID",
        value: userId,
      },
    });

    await prisma.systemSetting.create({
      data: {
        key: "ADMIN_TELEGRAM_BOT_TOKEN",
        value: botToken,
      },
    });

    console.log("✅ Настройки успешно добавлены в базу данных!");
    console.log(`   User ID: ${userId}`);
    console.log(`   Bot Token: ${botToken.substring(0, 10)}...`);
    console.log("\n🎉 Теперь можете войти в админ-панель!");

  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

forceAddTelegram();
