import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@um/shared";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shop);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const shop = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = body.slug ? slugify(body.slug) : shop.slug ?? "shop";
  if (body.slug && slug !== shop.slug) {
    const taken = await prisma.vendor.findUnique({ where: { slug: slug! } });
    if (taken) slug = `${slug}-${shop.id.slice(-4)}`;
  }

  const updated = await prisma.vendor.update({
    where: { id: shop.id },
    data: {
      ...(body.businessName ? { businessName: body.businessName } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.tagline !== undefined ? { tagline: body.tagline } : {}),
      ...(body.city !== undefined ? { city: body.city } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(body.bannerUrl !== undefined ? { bannerUrl: body.bannerUrl } : {}),
      slug,
    },
  });

  return NextResponse.json(updated);
}
