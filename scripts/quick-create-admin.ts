import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Используем простой Prisma Client без adapter для скриптов
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log("=== Создание администратора ===\n");

    const email = "admin@misskurochka.kg";
    const password = "admin123";
    const fullName = "Администратор";

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`✅ Админ уже существует: ${email}`);
      console.log(`Роль: ${existingUser.role}`);
      console.log(`Статус: ${existingUser.status}`);
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

    console.log("✅ Администратор успешно создан!");
    console.log(`Email: ${admin.email}`);
    console.log(`Пароль: ${password}`);
    console.log(`Имя: ${admin.fullName}`);
    console.log(`Роль: ${admin.role}`);
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
