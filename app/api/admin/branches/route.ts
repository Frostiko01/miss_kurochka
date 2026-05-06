import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    // Строим условия фильтрации
    const where: any = {};

    // Поиск по названию, адресу или телефону
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Фильтр по статусу
    if (status !== "all") {
      where.status = status === "active" ? "active" : "inactive";
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            branchUsers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, phone, latitude, longitude, isActive, branchEmail, branchPassword } = body;

    if (!name || !address || !phone) {
      return NextResponse.json(
        { error: "Name, address, and phone are required" },
        { status: 400 }
      );
    }

    if (!branchEmail || !branchPassword) {
      return NextResponse.json(
        { error: "Branch email and password are required" },
        { status: 400 }
      );
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: branchEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(branchPassword, 10);

    // Создаем филиал
    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: isActive ? "active" : "inactive",
      },
    });

    // Создаем пользователя филиала
    const branchUser = await prisma.user.create({
      data: {
        email: branchEmail,
        fullName: name,
        passwordHash: hashedPassword,
        role: "branch",
        status: "active",
      },
    });

    // Связываем пользователя с филиалом
    await prisma.branchUser.create({
      data: {
        branchId: branch.id,
        userId: branchUser.id,
        assignedBy: session.user?.id || branchUser.id,
      },
    });

    return NextResponse.json({ branch, branchUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
