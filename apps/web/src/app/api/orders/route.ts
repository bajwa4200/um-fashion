import { auth } from "@/lib/auth";
import { getCommissionRate } from "@/lib/stripe";
import { getDisplayPrice, getPlatformFee } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true, vendor: { select: { businessName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentMethod, shippingAddress, productIds } = await req.json();
  const commissionRate = await getCommissionRate();

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  let items = cart.items;
  if (productIds?.length) {
    items = items.filter((i) => productIds.includes(i.productId));
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "No items to order" }, { status: 400 });
  }

  let totalAmount = 0;
  let totalPlatformFee = 0;

  const orderItemsData = items.map((item) => {
    const vendorPrice = Number(item.product.vendorPrice);
    const displayPrice = getDisplayPrice(vendorPrice, commissionRate);
    const platformFee = getPlatformFee(vendorPrice, commissionRate);
    totalAmount += displayPrice * item.quantity;
    totalPlatformFee += platformFee * item.quantity;

    return {
      productId: item.productId,
      vendorId: item.product.vendorId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      vendorPrice,
      displayPrice,
      platformFee,
    };
  });

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
      totalAmount,
      platformFee: totalPlatformFee,
      shippingAddress,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });

  // Remove ordered items from cart
  await prisma.cartItem.deleteMany({
    where: { id: { in: items.map((i) => i.id) } },
  });

  // Decrement stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  return NextResponse.json(order, { status: 201 });
}
