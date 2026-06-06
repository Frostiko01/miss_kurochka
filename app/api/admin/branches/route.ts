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
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status !== "all") {
      where.status = status === "active" ? "active" : "inactive";
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === "name") orderBy = { name: sortOrder };
    else if (sortBy === "status") orderBy = { status: sortOrder };

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
      orderBy,
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Branch ID and status are required" },
        { status: 400 }
      );
    }

    if (status !== "active" && status !== "inactive") {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    // Проверяем существование филиала
    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // Обновляем статус филиала
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ 
      success: true, 
      branch: updatedBranch 
    });
  } catch (error) {
    console.error("Error updating branch status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, address, phone, latitude, longitude, status, branchPassword } = body;

    if (!id || !name || !address || !phone) {
      return NextResponse.json(
        { error: "ID, name, address, and phone are required" },
        { status: 400 }
      );
    }

    // Проверяем существование филиала
    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // Обновляем филиал
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: status || existingBranch.status,
      },
    });

    // Если передан новый пароль — обновляем его у пользователя-филиала
    let passwordUpdated = false;
    if (branchPassword && String(branchPassword).trim().length > 0) {
      if (String(branchPassword).trim().length < 6) {
        return NextResponse.json(
          { error: "Пароль должен быть не менее 6 символов" },
          { status: 400 }
        );
      }

      // Находим пользователя, связанного с филиалом
      const branchUser = await prisma.branchUser.findFirst({
        where: { branchId: id },
      });

      if (branchUser) {
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(String(branchPassword).trim(), 10);
        await prisma.user.update({
          where: { id: branchUser.userId },
          data: { passwordHash: hashedPassword },
        });
        passwordUpdated = true;
      } else {
        return NextResponse.json(
          { error: "У этого филиала нет связанного пользователя для смены пароля" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      branch: updatedBranch,
      passwordUpdated,
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
