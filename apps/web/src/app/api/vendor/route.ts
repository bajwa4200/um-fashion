import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    include: {
      products: { where: { isActive: true } },
      orderItems: {
        include: { order: true, product: true },
        orderBy: { order: { createdAt: "desc" } },
        take: 20,
      },
    },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const stats = {
    totalProducts: vendor.products.length,
    totalOrders: vendor.orderItems.length,
    revenue: vendor.orderItems.reduce(
      (sum, item) => sum + Number(item.vendorPrice) * item.quantity,
      0
    ),
  };

  return NextResponse.json({ vendor, stats });
}

export async function POST(_req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  if (vendor.stripeAccountId) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: vendor.stripeAccountId,
        refresh_url: `${process.env.NEXTAUTH_URL}/vendor?stripe=refresh`,
        return_url: `${process.env.NEXTAUTH_URL}/vendor?stripe=success`,
        type: "account_onboarding",
      });
      return NextResponse.json({ url: accountLink.url });
    } catch {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      email: session.user.email!,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { stripeAccountId: account.id },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/vendor?stripe=refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/vendor?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch {
    return NextResponse.json({
      url: null,
      message: "Stripe not configured. Set STRIPE_SECRET_KEY in .env",
    });
  }
}
