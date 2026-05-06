import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
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

async function createAdmin() {
  console.log("=== Создание администратора Miss Kurochka ===\n");

  try {
    const email = await question("Email администратора: ");
    const password = await question("Пароль: ");
    const fullName = await question("Полное имя: ");

    if (!email || !password || !fullName) {
      console.error("❌ Все поля обязательны!");
      rl.close();
      return;
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`❌ Пользователь с email ${email} уже существует!`);
      rl.close();
      return;
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаем администратора
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "admin",
        status: "active",
      },
    });

    console.log("\n✅ Администратор успешно создан!");
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Имя: ${admin.fullName}`);
    console.log(`Роль: ${admin.role}`);

    console.log("\n⚠️  Не забудьте настроить Telegram для 2FA:");
    console.log("1. Создайте бота через @BotFather");
    console.log("2. Получите свой Telegram User ID через @userinfobot");
    console.log("3. Добавьте настройки в таблицу system_settings:");
    console.log("   - ADMIN_TELEGRAM_USER_ID");
    console.log("   - ADMIN_TELEGRAM_BOT_TOKEN");
    console.log("\nПодробнее в ADMIN_PANEL.md");
  } catch (error) {
    console.error("❌ Ошибка при создании администратора:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();
