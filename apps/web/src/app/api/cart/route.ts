import { auth } from "@/lib/auth";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { vendor: { select: { businessName: true } } } },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: { include: { vendor: { select: { businessName: true } } } },
          },
        },
      },
    });
  }

  return cart;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await getOrCreateCart(session.user.id);
  const commissionRate = await getCommissionRate();

  const items = cart.items.map((item) => ({
    ...item,
    product: productToClient(item.product, commissionRate),
  }));

  const total = items.reduce(
    (sum, item) => sum + item.product.displayPrice * item.quantity,
    0
  );

  return NextResponse.json({ items, total });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return NextResponse.json({ success: true });
}
