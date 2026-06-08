import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

// GET - Получить список пользователей
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role !== "all") where.role = role as Prisma.UserWhereInput["role"];
    if (status !== "all") where.status = status as Prisma.UserWhereInput["status"];

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: sortOrder };
    if (sortBy === "fullName") orderBy = { fullName: sortOrder };
    else if (sortBy === "email") orderBy = { email: sortOrder };
    else if (sortBy === "role") orderBy = { role: sortOrder };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            branchUsers: true,
          },
        },
      },
      orderBy,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json(
      { error: "Ошибка получения пользователей" },
      { status: 500 }
    );
  }
}

// POST - Создать нового пользователя
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await request.json();
    const { email, fullName, password, role, status } = body;

    // Валидация
    if (!email || !fullName || !password || !role) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Проверка существующего email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role,
        status: status || "active",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Users POST error:", error);
    return NextResponse.json(
      { error: "Ошибка создания пользователя" },
      { status: 500 }
    );
  }
}

// PUT - Обновить пользователя (только role и status)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await request.json();
    const { id, role, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID пользователя обязателен" },
        { status: 400 }
      );
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Users PUT error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления пользователя" },
      { status: 500 }
    );
  }
}

// PATCH - Изменить статус пользователя
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID и статус обязательны" },
        { status: 400 }
      );
    }

    // Нельзя заблокировать самого себя
    if (id === session.user.id && status === "blocked") {
      return NextResponse.json(
        { error: "Вы не можете заблокировать самого себя" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Users PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка изменения статуса" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить пользователя
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID пользователя обязателен" },
        { status: 400 }
      );
    }

    // Нельзя удалить самого себя
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Вы не можете удалить самого себя" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Пользователь удален" });
  } catch (error) {
    console.error("Users DELETE error:", error);
    return NextResponse.json(
      { error: "Ошибка удаления пользователя" },
      { status: 500 }
    );
  }
}
