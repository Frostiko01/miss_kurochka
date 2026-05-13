import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Получить корзину пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    console.log('🛒 Cart GET - Session:', session);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    console.log('🛒 Cart GET - User ID:', session.user.id, 'Type:', typeof session.user.id);

    // Получаем или создаем корзину
    let cart = await prisma.cart.findUnique({
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

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
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
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { error: "Ошибка получения корзины" },
      { status: 500 }
    );
  }
}

// POST - Добавить товар в корзину
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { menuItemId, quantity, modifiers, itemComment, branchId } = body;

    if (!menuItemId || !quantity) {
      return NextResponse.json(
        { error: "Не указан товар или количество" },
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
      // Если филиал изменился, очищаем корзину
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      
      await prisma.cart.update({
        where: { id: cart.id },
        data: { branchId },
      });
    }

    // Проверяем, есть ли уже такой товар в корзине
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        menuItemId,
      },
      include: {
        modifiers: true,
      },
    });

    if (existingItem) {
      // Обновляем количество
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Создаем новую позицию
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          quantity,
          itemComment: itemComment || null,
        },
      });

      // Добавляем модификаторы если есть
      if (modifiers && modifiers.length > 0) {
        await prisma.cartItemModifier.createMany({
          data: modifiers.map((modifierId: string) => ({
            cartItemId: cartItem.id,
            modifierOptionId: modifierId,
          })),
        });
      }
    }

    // Возвращаем обновленную корзину
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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

    return NextResponse.json({ cart: updatedCart });
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
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json({ message: "Корзина очищена" });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { error: "Ошибка очистки корзины" },
      { status: 500 }
    );
  }
}
