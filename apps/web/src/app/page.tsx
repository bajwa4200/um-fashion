import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { ProductGrid } from "@/components/ProductGrid";
import { FeaturedShops } from "@/components/FeaturedShops";
import { Sparkles, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const commissionRate = await getCommissionRate();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { vendor: { select: { businessName: true, slug: true } } },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const clientProducts = products.map((p) => productToClient(p, commissionRate));

  return (
    <div>
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-transparent to-cyan-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <p className="text-cyan-400 text-sm font-medium tracking-[0.3em] uppercase mb-6">
            The future of fashion
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
            Wear the{" "}
            <span className="text-gradient">Future</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered styling with your own 3D body avatar. Shop curated boutiques
            for clothing, fragrance, and beauty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shops"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Explore Shops <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass text-white font-medium hover:bg-white/10 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      <FeaturedShops />

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: "Clothing", slug: "CLOTHING", emoji: "👗" },
            { name: "Footwear", slug: "FOOTWEAR", emoji: "👟" },
            { name: "Accessories", slug: "ACCESSORIES", emoji: "👜" },
            { name: "Fragrances", slug: "FRAGRANCES", emoji: "✨" },
            { name: "Makeup", slug: "MAKEUP", emoji: "💄" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="glass rounded-2xl p-6 text-center hover:glow-violet transition-all group"
            >
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">
                {cat.emoji}
              </span>
              <span className="font-medium text-sm">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold">Trending Now</h2>
          <Link href="/shop" className="text-sm text-violet-400 hover:text-violet-300">
            View all →
          </Link>
        </div>
        <ProductGrid products={clientProducts} />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 pb-24">
        <div className="glass rounded-3xl p-8 md:p-14 text-center glow-violet relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-cyan-500/10" />
          <div className="relative">
            <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Make Your Outfit</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-2">
              Upload your photo first — we build your 3D body. Then our AI stylist
              dresses you step by step.
            </p>
            <p className="text-sm text-cyan-400">Click the button in the navbar to start</p>
          </div>
        </div>
      </section>
    </div>
  );
}
