"use client";

import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Array<{
    id: string;
    name: string;
    displayPrice: number;
    images: string[];
    category: string;
    vendor?: { businessName: string };
  }>;
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">No products found</p>
        <p className="text-sm mt-2">Check back soon for new arrivals</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
