import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Генерация 6-значного кода
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Отправка кода через Telegram
async function sendTelegramCode(botToken: string, chatId: string, code: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔐 Ваш код для входа в админ-панель Miss Kurochka:\n\n${code}\n\nКод действителен 5 минут.`,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "invalidCredentials" },
        { status: 401 }
      );
    }

    // Проверяем роль
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "notAdmin" },
        { status: 403 }
      );
    }

    // Проверяем статус
    if (user.status === "blocked") {
      return NextResponse.json(
        { error: "accountBlocked" },
        { status: 403 }
      );
    }

    // Проверяем пароль
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "invalidCredentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "invalidCredentials" },
        { status: 401 }
      );
    }

    // Получаем настройки Telegram из базы данных
    const telegramUserIdSetting = await prisma.systemSetting.findUnique({
      where: { key: "ADMIN_TELEGRAM_USER_ID" },
    });

    const telegramBotTokenSetting = await prisma.systemSetting.findUnique({
      where: { key: "ADMIN_TELEGRAM_BOT_TOKEN" },
    });

    if (!telegramUserIdSetting || !telegramBotTokenSetting) {
      return NextResponse.json(
        { error: "telegramNotConfigured" },
        { status: 500 }
      );
    }

    const telegramUserId = telegramUserIdSetting.value;
    const telegramBotToken = telegramBotTokenSetting.value;

    // Генерируем код
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    // Сохраняем код в базу данных
    await prisma.verificationCode.create({
      data: {
        email: user.email!,
        code,
        type: "admin_2fa",
        expiresAt,
        used: false,
      },
    });

    // Отправляем код в Telegram
    const sent = await sendTelegramCode(telegramBotToken, telegramUserId, code);

    if (!sent) {
      return NextResponse.json(
        { error: "telegramSendFailed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Код отправлен в Telegram",
      userId: user.id,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "generic" },
      { status: 500 }
    );
  }
}
