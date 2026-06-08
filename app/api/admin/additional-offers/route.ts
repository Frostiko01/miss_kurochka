import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET - Получить все дополнительные предложения
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category");

    const where: Prisma.AdditionalOfferWhereInput = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (category) {
      where.category = category;
    }

    const offers = await prisma.additionalOffer.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Error fetching additional offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch additional offers" },
      { status: 500 }
    );
  }
}

// POST - Создать дополнительное предложение
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, imageUrl, category, isActive, sortOrder } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      );
    }

    const offer = await prisma.additionalOffer.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl?.trim() || null,
        category,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      },
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("Error creating additional offer:", error);
    return NextResponse.json(
      { error: "Failed to create additional offer" },
      { status: 500 }
    );
  }
}

// PUT - Обновить дополнительное предложение
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, price, imageUrl, category, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const offer = await prisma.additionalOffer.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl?.trim() || null,
        category,
        isActive,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
      },
    });

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("Error updating additional offer:", error);
    return NextResponse.json(
      { error: "Failed to update additional offer" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить дополнительное предложение
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    await prisma.additionalOffer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting additional offer:", error);
    return NextResponse.json(
      { error: "Failed to delete additional offer" },
      { status: 500 }
    );
  }
}
