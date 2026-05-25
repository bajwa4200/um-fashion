import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { normalizeProductImageUrl, shouldBypassImageOptimizer } from "@/lib/productImage";

interface VendorHeroProps {
  shop: {
    businessName: string;
    tagline?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    city?: string | null;
    rating: number;
    productCount: number;
  };
}

export function VendorHero({ shop }: VendorHeroProps) {
  const bannerSrc = shop.bannerUrl ? normalizeProductImageUrl(shop.bannerUrl) : null;
  const logoSrc = shop.logoUrl ? normalizeProductImageUrl(shop.logoUrl) : null;

  return (
    <div className="relative rounded-3xl overflow-hidden glass glow-violet mb-10">
      <div className="relative h-48 md:h-64">
        {bannerSrc ? (
          <Image
            src={bannerSrc}
            alt={shop.businessName}
            fill
            unoptimized={shouldBypassImageOptimizer(bannerSrc)}
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-violet-900/60 to-cyan-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
      </div>
      <div className="relative px-6 pb-6 -mt-12 flex flex-col md:flex-row gap-6 items-start md:items-end">
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-violet-500/40 glass flex-shrink-0">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt=""
              width={96}
              height={96}
              unoptimized={shouldBypassImageOptimizer(logoSrc)}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-violet-600 flex items-center justify-center text-3xl font-bold">
              {shop.businessName[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl md:text-4xl font-bold">{shop.businessName}</h1>
          {shop.tagline && <p className="text-cyan-400 mt-1">{shop.tagline}</p>}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              {shop.rating.toFixed(1)} rating
            </span>
            {shop.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {shop.city}
              </span>
            )}
            <span>{shop.productCount} products</span>
          </div>
          {shop.description && (
            <p className="text-gray-400 mt-4 max-w-2xl text-sm leading-relaxed">{shop.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
