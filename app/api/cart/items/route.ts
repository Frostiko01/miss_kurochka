import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const CART_INCLUDE = {
  items: {
    include: {
      menuItem: {
        include: {
          images: true,
          category: true,
          sizes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          spices: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      },
      comboOffer: true,
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
} as const;

function normalizeCart(cart: any) {
  if (!cart) return cart;
  return {
    ...cart,
    items: cart.items.map((item: any) => {
      if (item.menuItem) {
        const firstSize = item.menuItem.sizes?.[0];
        return {
          ...item,
          menuItem: {
            ...item.menuItem,
            price: firstSize ? Number(firstSize.price) : 0,
            weightGrams: firstSize?.weightGrams ?? null,
            sizes: (item.menuItem.sizes || []).map((s: any) => ({ ...s, price: Number(s.price) })),
            spices: (item.menuItem.spices || []).map((sp: any) => ({ ...sp, price: Number(sp.price) })),
          },
        };
      }
      if (item.comboOffer) {
        return {
          ...item,
          comboOffer: {
            ...item.comboOffer,
            price: Number(item.comboOffer.price),
            oldPrice: item.comboOffer.oldPrice ? Number(item.comboOffer.oldPrice) : null,
          },
        };
      }
      return item;
    }),
  };
}

// PATCH - Обновить количество позиции в корзине
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

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId: session.user.id },
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: CART_INCLUDE,
    });

    return NextResponse.json({ cart: normalizeCart(cart) });
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
      return NextResponse.json({ error: "Не указана позиция" }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId: session.user.id },
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: CART_INCLUDE,
    });

    return NextResponse.json({ cart: normalizeCart(cart) });
  } catch (error) {
    console.error("Cart item DELETE error:", error);
    return NextResponse.json(
      { error: "Ошибка удаления позиции" },
      { status: 500 }
    );
  }
}
