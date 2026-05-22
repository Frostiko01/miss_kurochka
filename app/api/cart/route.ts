import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Единый include для возврата корзины — чтобы фронт всегда получал одинаковую структуру
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
      spices: {
        include: {
          spice: true,
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
        const sizes = (item.menuItem.sizes || []).map((s: any) => ({ ...s, price: Number(s.price) }));
        const selectedSize = item.sizeId
          ? sizes.find((s: any) => s.id === item.sizeId) ?? sizes[0]
          : sizes[0];
        // Цена специй выбранных для этой позиции
        const spicesPrice = (item.spices || []).reduce((sum: number, cs: any) => {
          return sum + Number(cs.spice?.price ?? 0);
        }, 0);
        const itemBasePrice = selectedSize ? Number(selectedSize.price) : 0;
        return {
          ...item,
          menuItem: {
            ...item.menuItem,
            price: itemBasePrice + spicesPrice, // итоговая цена = размер + специи
            weightGrams: selectedSize?.weightGrams ?? null,
            sizes,
            spices: (item.menuItem.spices || []).map((sp: any) => ({ ...sp, price: Number(sp.price) })),
          },
          // Выбранные специи для этой позиции корзины
          selectedSpices: (item.spices || []).map((cs: any) => ({
            id: cs.spice?.id,
            name: cs.spice?.name,
            price: Number(cs.spice?.price ?? 0),
          })),
          spicesPrice,
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

// GET - Получить корзину пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: CART_INCLUDE,
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: CART_INCLUDE,
      });
    }

    return NextResponse.json({ cart: normalizeCart(cart) });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { error: "Ошибка получения корзины" },
      { status: 500 }
    );
  }
}

// POST - Добавить товар или комбо в корзину
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { menuItemId, comboOfferId, quantity, modifiers, spices, itemComment, branchId, sizeId } = body;

    // Должен быть указан либо menuItemId, либо comboOfferId
    if ((!menuItemId && !comboOfferId) || !quantity) {
      return NextResponse.json(
        { error: "Не указан товар/комбо или количество" },
        { status: 400 }
      );
    }

    // Получаем или создаем корзину
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          branchId: branchId || null,
        },
      });
    } else if (branchId && cart.branchId !== branchId) {
      // Если филиал изменился — очищаем корзину
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { branchId },
      });
    }

    if (comboOfferId) {
      // Добавляем комбо как отдельную позицию
      const existingCombo = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, comboOfferId },
      });

      if (existingCombo) {
        await prisma.cartItem.update({
          where: { id: existingCombo.id },
          data: { quantity: existingCombo.quantity + quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            comboOfferId,
            quantity,
            itemComment: itemComment || null,
          },
        });
      }
    } else {
      // Обычное блюдо: ищем по menuItemId + sizeId + одинаковым модификаторам + специям
      const candidateItems = await prisma.cartItem.findMany({
        where: {
          cartId: cart.id,
          menuItemId,
          sizeId: sizeId ?? null,
        },
        include: { modifiers: true, spices: true },
      });

      const sortedNewMods = [...(modifiers || [])].sort();
      const sortedNewSpices = [...(spices || [])].sort();
      const existingItem = candidateItems.find((it) => {
        const existingMods = it.modifiers.map((m) => m.modifierOptionId).sort();
        const existingSpices = it.spices.map((s) => s.spiceId).sort();
        if (existingMods.length !== sortedNewMods.length) return false;
        if (existingSpices.length !== sortedNewSpices.length) return false;
        return (
          existingMods.every((m, i) => m === sortedNewMods[i]) &&
          existingSpices.every((s, i) => s === sortedNewSpices[i])
        );
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        const cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            menuItemId,
            sizeId: sizeId ?? null,
            quantity,
            itemComment: itemComment || null,
          },
        });

        if (modifiers && modifiers.length > 0) {
          await prisma.cartItemModifier.createMany({
            data: modifiers.map((modifierId: string) => ({
              cartItemId: cartItem.id,
              modifierOptionId: modifierId,
            })),
          });
        }

        if (spices && spices.length > 0) {
          await prisma.cartItemSpice.createMany({
            data: spices.map((spiceId: string) => ({
              cartItemId: cartItem.id,
              spiceId,
            })),
          });
        }
      }
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });

    return NextResponse.json({ cart: normalizeCart(updatedCart) });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { error: "Ошибка добавления в корзину" },
      { status: 500 }
    );
  }
}

// DELETE - Очистить корзину
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { error: "Ошибка очистки корзины" },
      { status: 500 }
    );
  }
}
