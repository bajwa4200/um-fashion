import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { VendorHero } from "@/components/VendorHero";
import { ProductGrid } from "@/components/ProductGrid";

export const dynamic = "force-dynamic";

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const commissionRate = await getCommissionRate();

  const shop = await prisma.vendor.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      products: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  if (!shop) notFound();

  const products = shop.products.map((p) => ({
    ...productToClient(p, commissionRate),
    vendor: { businessName: shop.businessName },
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <VendorHero
        shop={{
          businessName: shop.businessName,
          tagline: shop.tagline,
          description: shop.description,
          logoUrl: shop.logoUrl,
          bannerUrl: shop.bannerUrl,
          city: shop.city,
          rating: shop.rating,
          productCount: shop._count.products,
        }}
      />
      <h2 className="font-display text-2xl font-bold mb-6">All Products</h2>
      <ProductGrid products={products} />
    </div>
  );
}
