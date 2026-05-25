import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const shops = await prisma.vendor.findMany({
    where: { status: "APPROVED" },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json(
    shops.map((s) => ({
      id: s.id,
      businessName: s.businessName,
      slug: s.slug,
      tagline: s.tagline,
      description: s.description,
      logoUrl: s.logoUrl,
      bannerUrl: s.bannerUrl,
      city: s.city,
      rating: s.rating,
      productCount: s._count.products,
    }))
  );
}
