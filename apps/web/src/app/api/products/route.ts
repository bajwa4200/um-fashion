import { auth } from "@/lib/auth";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const outfitStep = searchParams.get("outfitStep");
  const search = searchParams.get("search");

  const commissionRate = await getCommissionRate();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category: category as never } : {}),
      ...(outfitStep ? { outfitStep: outfitStep as never } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { vendor: { select: { businessName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    products.map((p) => productToClient(p, commissionRate))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "VENDOR" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor || vendor.status !== "APPROVED") {
    return NextResponse.json({ error: "Vendor not approved" }, { status: 403 });
  }

  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      name: body.name,
      description: body.description,
      category: body.category,
      vendorPrice: body.vendorPrice,
      stock: body.stock ?? 0,
      sizes: body.sizes ?? [],
      colors: body.colors ?? [],
      images: body.images ?? [],
      outfitStep: body.outfitStep ?? null,
    },
  });

  const commissionRate = await getCommissionRate();
  return NextResponse.json(productToClient(product, commissionRate), { status: 201 });
}
