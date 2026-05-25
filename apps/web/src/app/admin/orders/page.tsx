"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@um/shared";

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  user: { name: string; email: string };
  items: Array<{ product: { name: string } }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => fetch("/api/admin/orders").then((r) => r.json()).then(setOrders);
  useEffect(() => { load(); }, []);

  const updateOrder = async (orderId: string, status: string) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Manage Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="glass rounded-xl p-4">
            <div className="flex flex-wrap justify-between gap-4 mb-2">
              <div>
                <p className="font-medium">#{o.id.slice(-8)}</p>
                <p className="text-sm text-gray-400">{o.user.email}</p>
              </div>
              <p className="font-bold text-gradient">{formatCurrency(Number(o.totalAmount))}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateOrder(o.id, s)}
                  className={`px-2 py-1 rounded text-xs ${
                    o.status === s ? "bg-violet-600 text-white" : "glass text-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
