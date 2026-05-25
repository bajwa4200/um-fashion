import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [users, vendors, orders, settings] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count(),
    prisma.order.count(),
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const revenue = await prisma.order.aggregate({
    _sum: { platformFee: true, totalAmount: true },
    where: { paymentStatus: "PAID" },
  });

  return NextResponse.json({
    stats: {
      users,
      vendors,
      orders,
      totalRevenue: Number(revenue._sum.totalAmount ?? 0),
      platformFees: Number(revenue._sum.platformFee ?? 0),
    },
    settings,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const settings = await prisma.platformSettings.update({
    where: { id: "default" },
    data: body,
  });

  return NextResponse.json(settings);
}
