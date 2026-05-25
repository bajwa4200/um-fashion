/**
 * Refresh all product images to white-background placehold.co URLs.
 * Run: npm run db:refresh-images
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function productImage(label: string) {
  const text = encodeURIComponent(label.slice(0, 24));
  return `https://placehold.co/600x800/f5f5f5/2d2d2d/png?text=${text}&font=roboto`;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { images: [productImage(p.name)] },
    });
  }
  const vendors = await prisma.vendor.findMany({ select: { id: true, slug: true } });
  for (const v of vendors) {
    await prisma.vendor.update({
      where: { id: v.id },
      data: {
        logoUrl: `https://placehold.co/200x200/f0f0f0/333333/png?text=${encodeURIComponent(v.slug)}`,
        bannerUrl: `https://placehold.co/1200x400/f0f0f0/333333/png?text=${encodeURIComponent(v.slug)}`,
      },
    });
  }
  console.log(`Refreshed ${products.length} products and ${vendors.length} vendor images`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
