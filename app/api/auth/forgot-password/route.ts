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
      include: {
        accounts: true, // Включаем OAuth аккаунты
      },
    });

    // Из соображений безопасности всегда возвращаем успех,
    // даже если пользователь не найден
    if (!user) {
      return NextResponse.json({
        message: "Если пользователь существует, код отправлен на email",
      });
    }

    // Проверяем, зарегистрирован ли пользователь через OAuth без пароля
    const hasOAuthAccount = user.accounts && user.accounts.length > 0;
    const hasPassword = !!user.passwordHash;

    if (hasOAuthAccount && !hasPassword) {
      const provider = user.accounts[0].provider;
      const providerName = provider === 'google' ? 'Google' : provider;
      return NextResponse.json(
        { 
          error: `Этот аккаунт зарегистрирован через ${providerName}. Восстановление пароля недоступно. Войдите через ${providerName}.` 
        },
        { status: 400 }
      );
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
