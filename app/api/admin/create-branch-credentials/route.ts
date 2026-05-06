import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Проверяем, что это админ
    const session = await auth();
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { branchId, email, password, fullName } = await request.json();

    if (!branchId || !email || !password || !fullName) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли филиал
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Филиал не найден" },
        { status: 404 }
      );
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаем пользователя с ролью branch
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "branch",
        status: "active",
      },
    });

    // Связываем пользователя с филиалом
    await prisma.branchUser.create({
      data: {
        branchId,
        userId: user.id,
        assignedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Учетные данные филиала созданы",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create branch credentials error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании учетных данных" },
      { status: 500 }
    );
  }
}
