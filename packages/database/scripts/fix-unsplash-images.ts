/**
 * One-time: replace legacy Unsplash product image URLs with picsum seeds.
 * Run: npx tsx packages/database/scripts/fix-unsplash-images.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toPicsum(url: string): string {
  const seed = url.replace(/[^a-zA-Z0-9]/g, "").slice(-24) || "product";
  return `https://picsum.photos/seed/${seed}/600/800`;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, images: true } });
  let updated = 0;
  for (const p of products) {
    const imgs = p.images as string[];
    if (!Array.isArray(imgs)) continue;
    const needsFix = imgs.some((u) => typeof u === "string" && u.includes("unsplash.com"));
    if (!needsFix) continue;
    const newImages = imgs.map((u) =>
      typeof u === "string" && u.includes("unsplash.com") ? toPicsum(u) : u
    );
    await prisma.product.update({ where: { id: p.id }, data: { images: newImages } });
    updated++;
  }
  console.log(`Updated ${updated} products with legacy Unsplash URLs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
