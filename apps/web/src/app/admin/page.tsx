"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@um/shared";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    users: number;
    vendors: number;
    orders: number;
    totalRevenue: number;
    platformFees: number;
  } | null>(null);
  const [commissionRate, setCommissionRate] = useState(0.15);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setCommissionRate(Number(data.settings?.commissionRate ?? 0.15));
      });
  }, []);

  const handleIndexProducts = async () => {
    await fetch("/api/outfit/index-products", { method: "POST" });
    alert("Products indexed for AI recommendations");
  };

  if (!stats) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Super Admin Panel</h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Users", value: stats.users },
          { label: "Vendors", value: stats.vendors },
          { label: "Orders", value: stats.orders },
          { label: "Platform Fees", value: formatCurrency(stats.platformFees) },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-6 glow-violet">
            <p className="text-gray-400 text-sm">{s.label}</p>
            <p className="font-display text-3xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-6 mb-8">
        <h2 className="font-display text-xl font-bold mb-4">Platform Settings</h2>
        <p className="text-gray-400">
          Commission rate: <span className="text-cyan-400">{(commissionRate * 100).toFixed(0)}%</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Total revenue: {formatCurrency(stats.totalRevenue)}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <a href="/admin/vendors" className="px-4 py-2 glass rounded-xl hover:bg-white/5">
          Manage Vendors
        </a>
        <a href="/admin/users" className="px-4 py-2 glass rounded-xl hover:bg-white/5">
          Manage Users
        </a>
        <a href="/admin/orders" className="px-4 py-2 glass rounded-xl hover:bg-white/5">
          Manage Orders
        </a>
        <button
          onClick={handleIndexProducts}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm"
        >
          Re-index AI Products
        </button>
      </div>
    </div>
  );
}
