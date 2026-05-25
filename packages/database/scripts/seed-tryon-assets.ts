/**
 * Backfill tryOnImageUrl for existing products from tryon-images map.
 */
import { PrismaClient } from "@prisma/client";
import { tryOnImageForStep } from "../prisma/tryon-images";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { outfitStep: { not: "FRAGRANCE" } },
  });
  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const step = p.outfitStep || "SHIRT";
    const tryOn = tryOnImageForStep(step, i);
    if (!tryOn) continue;
    await prisma.product.update({
      where: { id: p.id },
      data: {
        tryOnImageUrl: tryOn,
        images: [tryOn],
      },
    });
    updated++;
  }
  console.log(`Updated try-on images for ${updated} products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
