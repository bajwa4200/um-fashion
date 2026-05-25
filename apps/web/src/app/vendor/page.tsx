"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@um/shared";
import { Plus, CreditCard } from "lucide-react";

export default function VendorDashboard() {
  const [data, setData] = useState<{
    vendor: { businessName: string; status: string; stripeOnboarded: boolean };
    stats: { totalProducts: number; totalOrders: number; revenue: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/vendor")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const handleStripeOnboard = async () => {
    const res = await fetch("/api/vendor", { method: "POST" });
    const result = await res.json();
    if (result.url) {
      window.location.href = result.url;
    } else {
      alert(result.message || "Stripe onboarding unavailable. Set STRIPE_SECRET_KEY in .env");
    }
  };

  if (!data) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Vendor Dashboard</h1>
          <p className="text-gray-400">{data.vendor.businessName}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/vendor/products/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          {!data.vendor.stripeOnboarded && (
            <button
              onClick={handleStripeOnboard}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm hover:bg-white/5"
            >
              <CreditCard className="w-4 h-4" /> Connect Stripe
            </button>
          )}
        </div>
      </div>

      {data.vendor.status !== "APPROVED" && (
        <div className="glass rounded-xl p-4 mb-6 border border-yellow-500/30 text-yellow-400">
          Your vendor account is {data.vendor.status.toLowerCase()}. Waiting for superadmin approval.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Products", value: data.stats.totalProducts },
          { label: "Orders", value: data.stats.totalOrders },
          { label: "Revenue", value: formatCurrency(data.stats.revenue) },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6 glow-violet">
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="font-display text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <Link href="/vendor/products" className="text-violet-400 hover:text-violet-300">
        Manage Products →
      </Link>
      <Link href="/vendor/shop" className="block mt-2 text-sm text-gray-400 hover:text-white">
        Edit Shop Settings →
      </Link>
    </div>
  );
}
