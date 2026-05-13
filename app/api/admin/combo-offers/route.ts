import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Получить все комбо
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const where: any = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const combos = await prisma.comboOffer.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ combos });
  } catch (error) {
    console.error("Error fetching combo offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch combo offers" },
      { status: 500 }
    );
  }
}

// POST - Создать комбо
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, items, price, oldPrice, imageUrl, isActive, sortOrder } = body;

    console.log("📝 Creating combo offer:", { name, price });

    if (!name || !price || !imageUrl) {
      return NextResponse.json(
        { error: "Name, price, and image are required" },
        { status: 400 }
      );
    }

    // Проверяем items - должен быть массив строк
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    const combo = await prisma.comboOffer.create({
      data: {
        name,
        description: description || null,
        items,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        imageUrl: imageUrl.trim(),
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      },
    });

    console.log("✅ Combo offer created:", combo.id);
    return NextResponse.json({ combo }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating combo offer:", error);
    return NextResponse.json(
      { error: "Failed to create combo offer" },
      { status: 500 }
    );
  }
}

// PUT - Обновить комбо
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, items, price, oldPrice, imageUrl, isActive, sortOrder } = body;

    console.log("🔄 Updating combo offer:", { id, name });

    if (!id) {
      return NextResponse.json(
        { error: "Combo ID is required" },
        { status: 400 }
      );
    }

    // Проверяем items - должен быть массив строк
    if (items && (!Array.isArray(items) || items.length === 0)) {
      return NextResponse.json(
        { error: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    const combo = await prisma.comboOffer.update({
      where: { id },
      data: {
        name,
        description: description || null,
        items,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        imageUrl: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined,
        isActive,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
      },
    });

    console.log("✅ Combo offer updated:", combo.id);
    return NextResponse.json({ combo });
  } catch (error) {
    console.error("❌ Error updating combo offer:", error);
    return NextResponse.json(
      { error: "Failed to update combo offer" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить комбо
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    console.log("🗑️ Deleting combo offer:", { id });

    if (!id) {
      return NextResponse.json(
        { error: "Combo ID is required" },
        { status: 400 }
      );
    }

    await prisma.comboOffer.delete({
      where: { id },
    });

    console.log("✅ Combo offer deleted:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting combo offer:", error);
    return NextResponse.json(
      { error: "Failed to delete combo offer" },
      { status: 500 }
    );
  }
}
