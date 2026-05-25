import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: {
      items: {
        include: { vendor: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentMethod !== "STRIPE") {
    return NextResponse.json({ error: "Not a Stripe order" }, { status: 400 });
  }

  // Group by vendor for separate payment intents
  const vendorGroups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const existing = vendorGroups.get(item.vendorId) || [];
    existing.push(item);
    vendorGroups.set(item.vendorId, existing);
  }

  const paymentIntents = [];

  for (const [vendorId, items] of vendorGroups) {
    const vendor = items[0].vendor;
    const amount = Math.round(
      items.reduce((sum, i) => sum + Number(i.displayPrice) * i.quantity, 0) * 100
    );
    const platformFee = Math.round(
      items.reduce((sum, i) => sum + Number(i.platformFee) * i.quantity, 0) * 100
    );

    const intentData: Record<string, unknown> = {
      amount,
      currency: "usd",
      metadata: { orderId: order.id, vendorId },
    };

    if (vendor.stripeAccountId && vendor.stripeOnboarded) {
      intentData.application_fee_amount = platformFee;
      intentData.transfer_data = { destination: vendor.stripeAccountId };
    }

    try {
      const intent = await stripe.paymentIntents.create(intentData as never);
      paymentIntents.push({
        vendorId,
        clientSecret: intent.client_secret,
        amount,
      });
    } catch {
      // Stripe not configured — return mock for dev
      paymentIntents.push({
        vendorId,
        clientSecret: "mock_secret_dev_mode",
        amount,
        devMode: true,
      });
    }
  }

  return NextResponse.json({ paymentIntents, orderId: order.id });
}
