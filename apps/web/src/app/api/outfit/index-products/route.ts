import { auth } from "@/lib/auth";
import { aiIndexProducts } from "@/lib/ai";
import { getCommissionRate } from "@/lib/stripe";
import { getDisplayPrice } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function indexAll() {
  const commissionRate = await getCommissionRate();
  const products = await prisma.product.findMany({ where: { isActive: true } });
  return aiIndexProducts(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      outfitStep: p.outfitStep,
      colors: p.colors,
      displayPrice: getDisplayPrice(Number(p.vendorPrice), commissionRate),
      images: p.images,
      tryOnImageUrl: p.tryOnImageUrl,
      scenarioTags: p.scenarioTags,
      genderTarget: p.genderTarget,
      season: p.season,
    }))
  );
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const indexed = await indexAll();
  return NextResponse.json(indexed);
}

export async function GET() {
  const indexed = await indexAll();
  return NextResponse.json(indexed);
}
