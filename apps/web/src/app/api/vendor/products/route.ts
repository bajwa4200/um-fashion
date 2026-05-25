import { auth } from "@/lib/auth";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const commissionRate = await getCommissionRate();
  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products.map((p) => productToClient(p, commissionRate)));
}
