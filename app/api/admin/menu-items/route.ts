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
    const where: any = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (status !== "all") where.isActive = status === "active";
    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { select: { imageUrl: true, isPrimary: true }, orderBy: { isPrimary: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { categoryId, name, description, price, weightGrams, cookingTimeMinutes, imageUrl, isActive } = body;
    if (!categoryId || !name || !price) {
      return NextResponse.json({ error: "Category, name, and price are required" }, { status: 400 });
    }
    const menuItem = await prisma.menuItem.create({
      data: {
        categoryId, name, description: description || null, price: parseFloat(price),
        weightGrams: weightGrams ? parseInt(weightGrams) : null,
        cookingTimeMinutes: cookingTimeMinutes ? parseInt(cookingTimeMinutes) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    if (imageUrl) {
      await prisma.menuItemImage.create({
        data: { menuItemId: menuItem.id, imageUrl, isPrimary: true },
      });
    }
    return NextResponse.json({ menuItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id, categoryId, name, description, price, weightGrams, cookingTimeMinutes, imageUrl, isActive } = body;
    if (!id || !categoryId || !name || !price) {
      return NextResponse.json({ error: "ID, category, name, and price are required" }, { status: 400 });
    }
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId, name, description: description || null, price: parseFloat(price),
        weightGrams: weightGrams ? parseInt(weightGrams) : null,
        cookingTimeMinutes: cookingTimeMinutes ? parseInt(cookingTimeMinutes) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    if (imageUrl) {
      await prisma.menuItemImage.deleteMany({ where: { menuItemId: id } });
      await prisma.menuItemImage.create({ data: { menuItemId: id, imageUrl, isPrimary: true } });
    }
    return NextResponse.json({ menuItem });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });
    }
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
