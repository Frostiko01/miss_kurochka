import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH - Обновить количество товара в корзине
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: "Не указана позиция или количество" },
        { status: 400 }
      );
    }

    // Проверяем что позиция принадлежит пользователю
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: {
          userId: session.user.id,
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Позиция не найдена" },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      // Удаляем позицию если количество 0 или меньше
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      // Обновляем количество
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    }

    // Возвращаем обновленную корзину
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                images: true,
                category: true,
              },
            },
            modifiers: {
              include: {
                modifierOption: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        branch: true,
      },
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Cart item PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления позиции" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить позицию из корзины
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("id");

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Не указана позиция" },
        { status: 400 }
      );
    }

    // Проверяем что позиция принадлежит пользователю
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: {
          userId: session.user.id,
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Позиция не найдена" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    // Возвращаем обновленную корзину
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                images: true,
                category: true,
              },
            },
            modifiers: {
              include: {
                modifierOption: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        branch: true,
      },
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Cart item DELETE error:", error);
    return NextResponse.json(
      { error: "Ошибка удаления позиции" },
      { status: 500 }
    );
  }
}
