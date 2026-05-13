import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Получить все дополнительные предложения (глобальные + своего филиала)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";

    const where: any = {
      OR: [
        { branchId: null }, // Глобальные предложения
        { branchId: branchUser.branchId }, // Предложения филиала
      ],
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (category !== "all") {
      where.category = category;
    }

    if (status !== "all") {
      where.isActive = status === "active";
    }

    const offers = await prisma.additionalOffer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

// POST - Создать предложение для своего филиала
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, price, category, imageUrl, isActive } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const offer = await prisma.additionalOffer.create({
      data: {
        name,
        description: description || null,
        price,
        category,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        branchId: branchUser.branchId, // Привязываем к филиалу
      },
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}

// PUT - Обновить предложение (только свои)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, description, price, category, imageUrl, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    // Проверяем что предложение принадлежит этому филиалу
    const existingOffer = await prisma.additionalOffer.findUnique({
      where: { id },
    });

    if (!existingOffer || existingOffer.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Offer not found or access denied" },
        { status: 404 }
      );
    }

    const offer = await prisma.additionalOffer.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price,
        category,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить предложение (только свои)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    // Проверяем что предложение принадлежит этому филиалу
    const existingOffer = await prisma.additionalOffer.findUnique({
      where: { id },
    });

    if (!existingOffer || existingOffer.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Offer not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.additionalOffer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    );
  }
}
