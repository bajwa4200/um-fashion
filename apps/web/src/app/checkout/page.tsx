"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

export default function CheckoutPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "COD">("STRIPE");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod,
        shippingAddress: address,
      }),
    });

    if (!orderRes.ok) {
      setLoading(false);
      alert("Checkout failed");
      return;
    }

    const order = await orderRes.json();

    if (paymentMethod === "STRIPE") {
      const stripeRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const stripeData = await stripeRes.json();

      if (stripeData.paymentIntents?.[0]?.devMode) {
        alert("Order placed! (Stripe dev mode — configure STRIPE_SECRET_KEY for live payments)");
      } else if (stripeData.paymentIntents?.[0]?.clientSecret) {
        alert("Order created! Complete payment with Stripe client secret in production.");
      }
    }

    router.push("/orders");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Checkout</h1>

      <GlassCard glow="violet" className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Shipping Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[100px]"
            placeholder="Enter your full shipping address"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-3">Payment Method</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer hover:bg-white/5">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "STRIPE"}
                onChange={() => setPaymentMethod("STRIPE")}
                className="accent-violet-500"
              />
              <div>
                <p className="font-medium">Online Payment</p>
                <p className="text-xs text-gray-400">Credit/Debit card via Stripe</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer hover:bg-white/5">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="accent-violet-500"
              />
              <div>
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-xs text-gray-400">Pay when your order arrives</p>
              </div>
            </label>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading || !address}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </GlassCard>
    </div>
  );
}
