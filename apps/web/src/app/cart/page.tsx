"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { normalizeProductImageUrl, shouldBypassImageOptimizer } from "@/lib/productImage";
import Link from "next/link";
import { formatCurrency } from "@um/shared";
import { Trash2 } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    displayPrice: number;
    images: string[];
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeItem = async (itemId: string) => {
    await fetch("/api/cart/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    loadCart();
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-gray-400">Loading cart...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-gray-400 mb-4">Your cart is empty</p>
          <Link
            href="/shop"
            className="text-violet-400 hover:text-violet-300"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="glass rounded-xl p-4 flex gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {item.product.images[0] && (() => {
                    const src = normalizeProductImageUrl(item.product.images[0]);
                    return (
                    <Image
                      src={src}
                      alt={item.product.name}
                      fill
                      unoptimized={shouldBypassImageOptimizer(src)}
                      className="object-cover"
                    />
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/product/${item.product.id}`}
                    className="font-medium hover:text-violet-400"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-cyan-400 mt-1">
                    {formatCurrency(item.product.displayPrice)} × {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-6 h-fit glow-violet">
            <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-gray-500">
              <span>Includes 15% platform fee</span>
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between font-bold text-lg mb-6">
              <span>Total</span>
              <span className="text-gradient">{formatCurrency(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
