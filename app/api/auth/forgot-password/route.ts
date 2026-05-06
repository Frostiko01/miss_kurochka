import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Из соображений безопасности всегда возвращаем успех,
    // даже если пользователь не найден
    if (!user) {
      return NextResponse.json({
        message: "Если пользователь существует, код отправлен на email",
      });
    }

    // Генерируем код
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые неиспользованные коды
    await prisma.verificationCode.deleteMany({
      where: {
        email,
        type: "password_reset",
        used: false,
      },
    });

    // Сохраняем новый код
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type: "password_reset",
        expiresAt,
      },
    });

    // Отправляем email
    await sendPasswordResetEmail(email, code);

    return NextResponse.json({
      message: "Код отправлен на email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Ошибка при отправке кода" },
      { status: 500 }
    );
  }
}
