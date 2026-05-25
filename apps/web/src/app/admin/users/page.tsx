"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  vendor?: { businessName: string; status: string };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const load = () => fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  const toggleActive = async (userId: string, isActive: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isActive }),
    });
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Manage Users</h1>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="glass rounded-xl p-4 flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="font-medium">{u.name || u.email}</p>
              <p className="text-sm text-gray-400">{u.email} · {u.role}</p>
              {u.vendor && (
                <p className="text-xs text-gray-500">{u.vendor.businessName} ({u.vendor.status})</p>
              )}
            </div>
            <button
              onClick={() => toggleActive(u.id, !u.isActive)}
              className={`px-3 py-1 rounded-full text-xs ${
                u.isActive ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
              }`}
            >
              {u.isActive ? "Active" : "Suspended"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
