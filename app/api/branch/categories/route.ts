import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET - Получить категории филиала
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
      include: { branch: true },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: Prisma.MenuCategoryWhereInput = {
      OR: [
        { branchId: branchUser.branchId },
        { branchId: null },
      ],
    };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (status !== "all") {
      where.status = status as Prisma.MenuCategoryWhereInput["status"];
    }

    let orderBy: Prisma.MenuCategoryOrderByWithRelationInput = { createdAt: sortOrder };
    if (sortBy === "name") orderBy = { name: sortOrder };

    const categories = await prisma.menuCategory.findMany({
      where,
      include: {
        _count: {
          select: { menuItems: true },
        },
        branch: {
          select: { name: true },
        },
      },
      orderBy,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Создать категорию
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, imageUrl, status } = body;

    const category = await prisma.menuCategory.create({
      data: {
        branchId: branchUser.branchId,
        name,
        description,
        imageUrl,
        status: status || "active",
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Обновить категорию
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, description, imageUrl, status } = body;

    // Проверяем, что категория принадлежит филиалу
    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existingCategory.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Cannot edit global or other branch categories" },
        { status: 403 }
      );
    }

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        status,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить категорию
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id } = body;

    // Проверяем, что категория принадлежит филиалу
    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existingCategory.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Cannot delete global or other branch categories" },
        { status: 403 }
      );
    }

    if (existingCategory._count.menuItems > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with menu items" },
        { status: 400 }
      );
    }

    await prisma.menuCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
