import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

    const branchId = branchUser.branchId;

    // Получаем параметры фильтрации
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "all";

    // Формируем условия фильтрации
    const where: Prisma.MenuItemWhereInput = {
      isActive: true,
      // Блюда филиала + глобальные блюда администратора
      OR: [{ branchId: branchId }, { branchId: null }],
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (categoryId !== "all") {
      where.categoryId = categoryId;
    }

    // Получаем блюда
    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        stopList: {
          where: {
            branchId,
            restoredAt: null,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Получаем категории для фильтра
    const categories = await prisma.menuCategory.findMany({
      where: {
        OR: [
          { branchId: branchId },
          { branchId: null },
        ],
        status: "active",
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ menuItems, categories });
  } catch (error) {
    console.error("Error fetching branch menu:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
