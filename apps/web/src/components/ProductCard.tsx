"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatCurrency } from "@um/shared";
import { normalizeProductImageUrl, shouldBypassImageOptimizer } from "@/lib/productImage";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    displayPrice: number;
    images: string[];
    category: string;
    vendor?: { businessName: string };
  };
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const imageSrc = product.images[0] ? normalizeProductImageUrl(product.images[0]) : null;
  const unoptimized = imageSrc ? shouldBypassImageOptimizer(imageSrc) : false;

  // #region agent log
  if (imageSrc && index === 0) {
    try {
      const host = new URL(imageSrc).hostname;
      fetch("http://127.0.0.1:7639/ingest/4f077990-f18f-46cf-b585-c244c9282106", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "46bc0c" },
        body: JSON.stringify({
          sessionId: "46bc0c",
          location: "ProductCard.tsx:render",
          message: "product image host",
          data: { host, unoptimized, originalHost: product.images[0] ? new URL(product.images[0]).hostname : null },
          hypothesisId: "E",
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }
  // #endregion

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/product/${product.id}`} className="group block">
        <div className="glass rounded-2xl overflow-hidden glow-violet hover:glow-cyan transition-all duration-300">
          <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                unoptimized={unoptimized}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                No image
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-1 glass rounded-full text-xs text-cyan-400">
              {product.category}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-sm group-hover:text-violet-400 transition-colors line-clamp-1">
              {product.name}
            </h3>
            {product.vendor && (
              <p className="text-xs text-gray-500 mt-1">{product.vendor.businessName}</p>
            )}
            <p className="font-display text-lg font-bold mt-2 text-gradient">
              {formatCurrency(product.displayPrice)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
