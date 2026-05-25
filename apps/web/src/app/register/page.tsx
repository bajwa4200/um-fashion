"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVendor = searchParams.get("vendor") === "true";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    role: isVendor ? "VENDOR" : "USER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login");
  };

  return (
    <GlassCard className="w-full max-w-md" glow="cyan">
      <h1 className="font-display text-3xl font-bold text-gradient mb-2">
        {isVendor ? "Become a Vendor" : "Create Account"}
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        {isVendor
          ? "Start selling on UM Fashion marketplace"
          : "Join the future of fashion"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-500"
            minLength={6}
            required
          />
        </div>
        {isVendor && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Business Name</label>
            <input
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
          Sign In
        </Link>
      </p>
    </GlassCard>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
