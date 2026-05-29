import { prisma } from "../lib/prisma";
import * as dotenv from 'dotenv';

dotenv.config();

async function syncTelegramToDb() {
  try {
    console.log("🔄 Синхронизация настроек Telegram из .env в базу данных...\n");

    const botToken = process.env.ADMIN_TELEGRAM_BOT_TOKEN;
    const userId = process.env.ADMIN_TELEGRAM_USER_ID;

    if (!botToken || !userId) {
      console.error("❌ Настройки не найдены в .env файле");
      console.log("\nДобавьте в .env:");
      console.log("ADMIN_TELEGRAM_BOT_TOKEN=\"ваш-токен\"");
      console.log("ADMIN_TELEGRAM_USER_ID=\"ваш-user-id\"");
      return;
    }

    // Проверяем токен бота
    console.log("🔍 Проверка токена бота...");
    const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botData = await botResponse.json();

    if (!botData.ok) {
      console.error("❌ Неверный токен бота!");
      return;
    }

    console.log(`✅ Бот найден: @${botData.result.username}\n`);

    // Сохраняем в базу данных
    console.log("💾 Сохранение в базу данных...");

    await prisma.systemSetting.upsert({
      where: { key: "ADMIN_TELEGRAM_USER_ID" },
      update: { value: userId },
      create: {
        key: "ADMIN_TELEGRAM_USER_ID",
        value: userId,
      },
    });

    await prisma.systemSetting.upsert({
      where: { key: "ADMIN_TELEGRAM_BOT_TOKEN" },
      update: { value: botToken },
      create: {
        key: "ADMIN_TELEGRAM_BOT_TOKEN",
        value: botToken,
      },
    });

    console.log("✅ Настройки успешно сохранены в базу данных!");
    console.log(`   User ID: ${userId}`);
    console.log(`   Bot Token: ${botToken.substring(0, 10)}...`);

    // Отправляем тестовое сообщение
    console.log("\n📤 Отправка тестового сообщения...");
    const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: userId,
        text: "✅ Telegram успешно настроен для админ-панели Miss Kurochka!",
      }),
    });

    const testData = await testResponse.json();

    if (testData.ok) {
      console.log("✅ Тестовое сообщение отправлено!");
      console.log("\n🎉 Все готово! Можете войти в админ-панель:");
      console.log("   http://localhost:3000/admin/signin");
    } else {
      console.log("⚠️  Не удалось отправить тестовое сообщение");
      console.log("   Убедитесь, что вы отправили /start боту");
    }

  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncTelegramToDb();
