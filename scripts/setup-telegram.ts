import { prisma } from "../lib/prisma";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setupTelegram() {
  console.log("=== Настройка Telegram для админ-панели ===\n");

  try {
    console.log("Инструкция:");
    console.log("1. Создайте бота через @BotFather и получите токен");
    console.log("2. Получите свой Telegram User ID через @userinfobot");
    console.log("3. Отправьте любое сообщение вашему боту\n");

    const botToken = await question("Telegram Bot Token: ");
    const userId = await question("Telegram User ID: ");

    if (!botToken || !userId) {
      console.error("❌ Все поля обязательны!");
      rl.close();
      return;
    }

    // Проверяем токен бота
    console.log("\n🔍 Проверяю токен бота...");
    const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botData = await botResponse.json();

    if (!botData.ok) {
      console.error("❌ Неверный токен бота!");
      rl.close();
      return;
    }

    console.log(`✅ Бот найден: @${botData.result.username}`);

    // Проверяем, может ли бот отправить сообщение
    console.log("\n📤 Отправляю тестовое сообщение...");
    const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: userId,
        text: "✅ Telegram успешно настроен для админ-панели Miss Kurochka!",
      }),
    });

    const testData = await testResponse.json();

    if (!testData.ok) {
      console.error("❌ Не удалось отправить сообщение!");
      console.error("Убедитесь, что вы отправили сообщение боту и User ID правильный.");
      rl.close();
      return;
    }

    console.log("✅ Тестовое сообщение отправлено!");

    // Сохраняем настройки в базу данных
    console.log("\n💾 Сохраняю настройки в базу данных...");

    // Проверяем существующие настройки
    const existingUserId = await prisma.systemSetting.findUnique({
      where: { key: "ADMIN_TELEGRAM_USER_ID" },
    });

    const existingBotToken = await prisma.systemSetting.findUnique({
      where: { key: "ADMIN_TELEGRAM_BOT_TOKEN" },
    });

    // Обновляем или создаем настройки
    if (existingUserId) {
      await prisma.systemSetting.update({
        where: { key: "ADMIN_TELEGRAM_USER_ID" },
        data: { value: userId },
      });
    } else {
      await prisma.systemSetting.create({
        data: {
          key: "ADMIN_TELEGRAM_USER_ID",
          value: userId,
        },
      });
    }

    if (existingBotToken) {
      await prisma.systemSetting.update({
        where: { key: "ADMIN_TELEGRAM_BOT_TOKEN" },
        data: { value: botToken },
      });
    } else {
      await prisma.systemSetting.create({
        data: {
          key: "ADMIN_TELEGRAM_BOT_TOKEN",
          value: botToken,
        },
      });
    }

    console.log("\n✅ Настройки успешно сохранены!");
    console.log("\n🎉 Telegram настроен! Теперь вы можете войти в админ-панель:");
    console.log("   http://localhost:3000/admin/signin");
  } catch (error) {
    console.error("❌ Ошибка при настройке Telegram:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

setupTelegram();
