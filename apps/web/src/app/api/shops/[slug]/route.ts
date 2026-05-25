import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const commissionRate = await getCommissionRate();

  const shop = await prisma.vendor.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  return NextResponse.json({
    shop: {
      id: shop.id,
      businessName: shop.businessName,
      slug: shop.slug,
      tagline: shop.tagline,
      description: shop.description,
      logoUrl: shop.logoUrl,
      bannerUrl: shop.bannerUrl,
      city: shop.city,
      rating: shop.rating,
      productCount: shop._count.products,
    },
    products: shop.products.map((p) => productToClient(p, commissionRate)),
  });
}
