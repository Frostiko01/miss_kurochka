import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email и код обязательны" },
        { status: 400 }
      );
    }

    // Находим код в базе данных
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: "admin_2fa",
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { error: "invalidCode" },
        { status: 401 }
      );
    }

    // Проверяем, не истек ли код
    if (verificationCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "codeExpired" },
        { status: 401 }
      );
    }

    // Помечаем код как использованный
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "notAdmin" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Код подтвержден",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin verify code error:", error);
    return NextResponse.json(
      { error: "generic" },
      { status: 500 }
    );
  }
}
