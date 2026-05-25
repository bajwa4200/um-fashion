import { auth } from "@/lib/auth";
import { aiRecommend, aiWeather } from "@/lib/ai";
import { getCommissionRate } from "@/lib/stripe";
import { getDisplayPrice } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { OutfitStep } from "@prisma/client";

async function dbFallbackRecommendations(
  outfitStep: string | undefined,
  occasion: string | undefined,
  limit = 8
) {
  const commissionRate = await getCommissionRate();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(outfitStep ? { outfitStep: outfitStep as OutfitStep } : {}),
      ...(occasion
        ? {
            OR: [
              { name: { contains: occasion, mode: "insensitive" } },
              { description: { contains: occasion, mode: "insensitive" } },
              { scenarioTags: { has: occasion.toLowerCase() } },
            ],
          }
        : {}),
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  if (products.length === 0 && outfitStep) {
    const byStep = await prisma.product.findMany({
      where: { isActive: true, outfitStep: outfitStep as OutfitStep },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    return byStep.map((p) => ({
      id: p.id,
      name: p.name,
      displayPrice: getDisplayPrice(Number(p.vendorPrice), commissionRate),
      image: p.tryOnImageUrl || (p.images as string[])?.[0] || "",
      reason: `From marketplace — ${outfitStep.replace("_", " ").toLowerCase()}`,
      category: p.category,
      outfitStep: p.outfitStep ?? undefined,
    }));
  }

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    displayPrice: getDisplayPrice(Number(p.vendorPrice), commissionRate),
    image: p.tryOnImageUrl || (p.images as string[])?.[0] || "",
    reason: `From marketplace${occasion ? ` for ${occasion}` : ""}`,
    category: p.category,
    outfitStep: p.outfitStep ?? undefined,
  }));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, outfitStep, occasion, location } = await req.json();

  let recommendations: Awaited<ReturnType<typeof aiRecommend>>["recommendations"] = [];
  let source = "ai";

  try {
    const aiResult = await aiRecommend({ query, outfitStep, occasion });
    recommendations = aiResult.recommendations || [];
  } catch {
    recommendations = [];
  }

  if (!recommendations.length) {
    recommendations = await dbFallbackRecommendations(outfitStep, occasion || query);
    source = "database";
  }

  const weather = location
    ? await aiWeather(location).catch(() => null)
    : null;

  return NextResponse.json({ recommendations, weather, source });
}
