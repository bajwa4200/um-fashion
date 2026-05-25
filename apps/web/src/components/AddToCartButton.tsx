"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    setAdded(true);
    setLoading(false);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
    >
      <ShoppingCart className="w-5 h-5" />
      {added ? "Added!" : loading ? "Adding..." : "Add to Cart"}
    </button>
  );
}
