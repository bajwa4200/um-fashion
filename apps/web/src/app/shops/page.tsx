import { prisma } from "@/lib/prisma";
import { ShopCard } from "@/components/ShopCard";

export const dynamic = "force-dynamic";

export default async function ShopsPage() {
  const shops = await prisma.vendor.findMany({
    where: { status: "APPROVED" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { rating: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10">
        <p className="text-cyan-400 text-sm uppercase tracking-widest mb-2">Marketplace</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient">All Shops</h1>
        <p className="text-gray-400 mt-3 max-w-xl">
          Discover {shops.length} curated fashion boutiques — clothing, footwear, fragrances, and beauty.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={{
              slug: shop.slug!,
              businessName: shop.businessName,
              tagline: shop.tagline,
              logoUrl: shop.logoUrl,
              bannerUrl: shop.bannerUrl,
              city: shop.city,
              rating: shop.rating,
              productCount: shop._count.products,
            }}
          />
        ))}
      </div>
    </div>
  );
}
