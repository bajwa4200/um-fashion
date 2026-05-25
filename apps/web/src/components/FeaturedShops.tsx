import { prisma } from "@/lib/prisma";
import { ShopCard } from "@/components/ShopCard";
import Link from "next/link";

export async function FeaturedShops() {
  const shops = await prisma.vendor.findMany({
    where: { status: "APPROVED" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { rating: "desc" },
    take: 6,
  });

  if (shops.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-cyan-400 text-sm uppercase tracking-widest mb-1">Curated</p>
          <h2 className="font-display text-3xl font-bold">Featured Shops</h2>
        </div>
        <Link href="/shops" className="text-sm text-violet-400 hover:text-violet-300">
          View all shops →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={{
              slug: shop.slug ?? "",
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
    </section>
  );
}
