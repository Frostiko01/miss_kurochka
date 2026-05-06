import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов"),
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step } = body;

    // Шаг 1: Отправка кода верификации
    if (step === "send_code") {
      const { email, password, fullName } = body;

      // Валидация данных
      const validatedData = registerSchema.parse({ email, password, fullName });

      // Проверяем, существует ли пользователь
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Пользователь с таким email уже существует" },
          { status: 400 }
        );
      }

      // Генерируем код
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

      // Удаляем старые неиспользованные коды
      await prisma.verificationCode.deleteMany({
        where: {
          email: validatedData.email,
          type: "email_verification",
          used: false,
        },
      });

      // Сохраняем новый код
      await prisma.verificationCode.create({
        data: {
          email: validatedData.email,
          code,
          type: "email_verification",
          expiresAt,
        },
      });

      // Отправляем email
      await sendVerificationEmail(validatedData.email, code);

      return NextResponse.json({
        message: "Код отправлен на email",
        email: validatedData.email,
      });
    }

    // Шаг 2: Проверка кода и создание пользователя
    if (step === "verify_and_register") {
      const { email, password, fullName, code } = body;

      // Валидация данных
      const validatedData = registerSchema.parse({ email, password, fullName });

      // Проверяем код
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          email: validatedData.email,
          code,
          type: "email_verification",
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!verificationCode) {
        return NextResponse.json(
          { error: "Неверный или истекший код" },
          { status: 400 }
        );
      }

      // Проверяем, не создан ли уже пользователь
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Пользователь уже существует" },
          { status: 400 }
        );
      }

      // Хешируем пароль
      const passwordHash = await bcrypt.hash(validatedData.password, 12);

      // Создаем пользователя
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          fullName: validatedData.fullName,
          role: "customer",
          status: "active",
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      });

      // Помечаем код как использованный
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true },
      });

      return NextResponse.json(
        {
          message: "Регистрация успешна",
          user,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Неверный шаг регистрации" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ошибка при регистрации" },
      { status: 500 }
    );
  }
}
