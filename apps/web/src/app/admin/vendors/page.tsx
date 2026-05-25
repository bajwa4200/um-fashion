"use client";

import { useEffect, useState } from "react";

interface Vendor {
  id: string;
  businessName: string;
  status: string;
  user: { email: string; name: string; isActive: boolean };
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const load = () => fetch("/api/admin/vendors").then((r) => r.json()).then(setVendors);
  useEffect(() => { load(); }, []);

  const updateStatus = async (vendorId: string, status: string) => {
    await fetch("/api/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, status }),
    });
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Manage Vendors</h1>
      <div className="space-y-3">
        {vendors.map((v) => (
          <div key={v.id} className="glass rounded-xl p-4 flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="font-medium">{v.businessName}</p>
              <p className="text-sm text-gray-400">{v.user.email}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 glass rounded-full text-xs">{v.status}</span>
              {v.status === "PENDING" && (
                <>
                  <button
                    onClick={() => updateStatus(v.id, "APPROVED")}
                    className="px-3 py-1 rounded-full bg-green-600/20 text-green-400 text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(v.id, "REJECTED")}
                    className="px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs"
                  >
                    Reject
                  </button>
                </>
              )}
              {v.status === "APPROVED" && (
                <button
                  onClick={() => updateStatus(v.id, "SUSPENDED")}
                  className="px-3 py-1 rounded-full bg-yellow-600/20 text-yellow-400 text-xs"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
