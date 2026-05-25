"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@um/shared";

interface Order {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    quantity: number;
    product: { name: string };
    vendor: { businessName: string };
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-gray-400">Loading orders...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl text-gray-400">
          No orders yet
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="glass rounded-xl p-6">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Order #{order.id.slice(-8)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 glass rounded-full text-xs">{order.status}</span>
                  <span className="px-3 py-1 glass rounded-full text-xs">{order.paymentStatus}</span>
                  <span className="px-3 py-1 glass rounded-full text-xs">{order.paymentMethod}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm text-gray-400">
                    {item.quantity}x {item.product.name} — {item.vendor.businessName}
                  </p>
                ))}
              </div>
              <p className="font-display text-lg font-bold text-gradient">
                {formatCurrency(Number(order.totalAmount))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
