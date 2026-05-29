import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * NOTE: Текущая схема Prisma не содержит поля `branchId` у `AdditionalOffer` —
 * все доп. предложения общие для всех филиалов. Поэтому филиал
 * может видеть и редактировать только глобальные офферы.
 * Если в будущем добавите `branchId` в схему — раскомментируйте логику ниже.
 */

// GET - Получить все дополнительные предложения
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверяем, что у пользователя есть привязка к филиалу
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

    const where: Prisma.AdditionalOfferWhereInput = {};

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

// POST - Создать предложение
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

// PUT - Обновить предложение
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
    const { id, name, description, price, category, imageUrl, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const existingOffer = await prisma.additionalOffer.findUnique({
      where: { id },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Offer not found" },
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

// DELETE - Удалить предложение
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

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const existingOffer = await prisma.additionalOffer.findUnique({
      where: { id },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Offer not found" },
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
