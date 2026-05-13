import { prisma } from "../lib/prisma";

async function getTelegramSettings() {
  try {
    console.log("🔍 Проверка настроек Telegram в базе данных...\n");

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["ADMIN_TELEGRAM_USER_ID", "ADMIN_TELEGRAM_BOT_TOKEN"],
        },
      },
    });

    if (settings.length === 0) {
      console.log("❌ Настройки Telegram не найдены в базе данных");
      console.log("\nЗапустите скрипт настройки:");
      console.log("  npx tsx scripts/setup-telegram.ts");
    } else {
      console.log("✅ Найдены настройки Telegram:\n");
      settings.forEach((setting) => {
        if (setting.key === "ADMIN_TELEGRAM_BOT_TOKEN") {
          console.log(`${setting.key}: ${setting.value.substring(0, 10)}...`);
        } else {
          console.log(`${setting.key}: ${setting.value}`);
        }
      });

      console.log("\n📝 Добавьте эти значения в .env файл:");
      settings.forEach((setting) => {
        console.log(`${setting.key}="${setting.value}"`);
      });
    }
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getTelegramSettings();
