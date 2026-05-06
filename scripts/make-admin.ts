import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import readline from "readline";
import * as dotenv from "dotenv";

// Загружаем переменные окружения из .env
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function makeAdmin() {
  try {
    console.log("🔧 Создание или обновление админа\n");

    const email = await question("Email админа: ");

    if (!email) {
      console.log("❌ Email обязателен!");
      process.exit(1);
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`\n✅ Пользователь найден: ${existingUser.fullName}`);
      console.log(`   Текущая роль: ${existingUser.role}`);

      if (existingUser.role === "admin") {
        console.log("   Пользователь уже админ!");
        const change = await question("\nИзменить пароль? (y/n): ");

        if (change.toLowerCase() === "y") {
          const password = await question("Новый пароль: ");
          const passwordHash = await bcrypt.hash(password, 10);

          await prisma.user.update({
            where: { email },
            data: { passwordHash },
          });

          console.log("\n✅ Пароль обновлен!");
        }
      } else {
        const makeAdmin = await question("\nСделать админом? (y/n): ");

        if (makeAdmin.toLowerCase() === "y") {
          await prisma.user.update({
            where: { email },
            data: { role: "admin" },
          });

          console.log("\n✅ Роль изменена на admin!");

          if (!existingUser.passwordHash) {
            const password = await question("Установить пароль: ");
            const passwordHash = await bcrypt.hash(password, 10);

            await prisma.user.update({
              where: { email },
              data: { passwordHash },
            });

            console.log("✅ Пароль установлен!");
          }
        }
      }
    } else {
      console.log("\n❌ Пользователь не найден. Создаем нового админа...\n");

      const fullName = await question("Полное имя: ");
      const password = await question("Пароль: ");

      const passwordHash = await bcrypt.hash(password, 10);

      const newAdmin = await prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash,
          role: "admin",
          status: "active",
        },
      });

      console.log("\n✅ Админ создан!");
      console.log(`   ID: ${newAdmin.id}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Имя: ${newAdmin.fullName}`);
      console.log(`   Роль: ${newAdmin.role}`);
    }

    console.log("\n📊 Список всех админов:");
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: {
        email: true,
        fullName: true,
        status: true,
      },
    });

    admins.forEach((admin) => {
      console.log(`   - ${admin.email} (${admin.fullName}) - ${admin.status}`);
    });
  } catch (error) {
    console.error("\n❌ Ошибка:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

makeAdmin();
