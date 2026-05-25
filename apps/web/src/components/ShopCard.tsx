import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { normalizeProductImageUrl, shouldBypassImageOptimizer } from "@/lib/productImage";

interface ShopCardProps {
  shop: {
    slug: string;
    businessName: string;
    tagline?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    city?: string | null;
    rating: number;
    productCount: number;
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  const bannerSrc = shop.bannerUrl ? normalizeProductImageUrl(shop.bannerUrl) : null;
  const logoSrc = shop.logoUrl ? normalizeProductImageUrl(shop.logoUrl) : null;

  return (
    <Link href={`/shops/${shop.slug}`} className="group block">
      <article className="glass rounded-2xl overflow-hidden hover:glow-violet transition-all duration-500">
        <div className="relative h-36 overflow-hidden">
          {bannerSrc ? (
            <Image
              src={bannerSrc}
              alt={shop.businessName}
              fill
              unoptimized={shouldBypassImageOptimizer(bannerSrc)}
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-cyan-900/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-xl overflow-hidden border-2 border-violet-500/50 glass">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt=""
                fill
                unoptimized={shouldBypassImageOptimizer(logoSrc)}
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full bg-violet-600 flex items-center justify-center text-xl font-bold">
                {shop.businessName[0]}
              </div>
            )}
          </div>
        </div>
        <div className="pt-10 p-4">
          <h3 className="font-display text-lg font-bold group-hover:text-violet-400 transition-colors">
            {shop.businessName}
          </h3>
          {shop.tagline && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">{shop.tagline}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              {shop.rating.toFixed(1)}
            </span>
            {shop.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {shop.city}
              </span>
            )}
            <span>{shop.productCount} items</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
