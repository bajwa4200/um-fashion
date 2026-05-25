"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@um/shared";

interface Product {
  id: string;
  name: string;
  vendorPrice: number;
  displayPrice: number;
  stock: number;
  category: string;
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/vendor/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-4xl font-bold">My Products</h1>
        <Link
          href="/vendor/products/new"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm"
        >
          Add Product
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="glass rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-400">{p.category} · Stock: {p.stock}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">You receive: {formatCurrency(p.vendorPrice)}</p>
              <p className="text-cyan-400">Listed at: {formatCurrency(p.displayPrice)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
