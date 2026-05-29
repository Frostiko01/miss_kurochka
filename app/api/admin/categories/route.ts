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
      where.name = { contains: search, mode: "insensitive" };
    }
    if (status !== "all") {
      where.status = status;
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === "name") orderBy = { name: sortOrder };

    const categories = await prisma.menuCategory.findMany({
      where,
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
    const { name, description, imageUrl, status, type, sortOrder } = body;

    console.log("📝 Creating category:", { name, type, sortOrder, hasImage: !!imageUrl, imageLength: imageUrl?.length });

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        description: description || null,
        imageUrl: (imageUrl && imageUrl.trim() !== '') ? imageUrl.trim() : null,
        status: status || "active",
        type: type || "regular",
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      },
    });

    console.log("✅ Category created:", category.id);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
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
    const { id, name, description, imageUrl, status, type, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      description: description || null,
      imageUrl: (imageUrl && imageUrl.trim() !== '') ? imageUrl.trim() : null,
      status,
    };

    if (type !== undefined) {
      updateData.type = type;
    }

    if (sortOrder !== undefined) {
      updateData.sortOrder = parseInt(sortOrder);
    }

    const category = await prisma.menuCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Проверяем существование категории
    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Удаляем категорию (каскадное удаление блюд настроено в схеме)
    await prisma.menuCategory.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: `Category deleted successfully. ${existingCategory._count.menuItems} menu items were also deleted.`
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
