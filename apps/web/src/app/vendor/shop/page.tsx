"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";

export default function VendorShopSettingsPage() {
  const [shop, setShop] = useState({
    businessName: "",
    slug: "",
    tagline: "",
    description: "",
    city: "",
    logoUrl: "",
    bannerUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/vendor/shop")
      .then((r) => r.json())
      .then((data) => {
        if (data.slug) {
          setShop({
            businessName: data.businessName || "",
            slug: data.slug || "",
            tagline: data.tagline || "",
            description: data.description || "",
            city: data.city || "",
            logoUrl: data.logoUrl || "",
            bannerUrl: data.bannerUrl || "",
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/vendor/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shop),
    });
    if (res.ok) {
      setMessage("Shop updated!");
      const data = await res.json();
      setShop((s) => ({ ...s, slug: data.slug }));
    } else {
      setMessage("Failed to save");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Shop Settings</h1>
        <Link href="/vendor" className="text-sm text-violet-400">← Dashboard</Link>
      </div>

      <GlassCard>
        <form onSubmit={handleSave} className="space-y-4">
          {message && <p className="text-sm text-cyan-400">{message}</p>}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Business Name</label>
            <input value={shop.businessName} onChange={(e) => setShop({ ...shop, businessName: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Shop URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">/shops/</span>
              <input value={shop.slug} onChange={(e) => setShop({ ...shop, slug: e.target.value })}
                className="flex-1 px-4 py-3 glass rounded-xl bg-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tagline</label>
            <input value={shop.tagline} onChange={(e) => setShop({ ...shop, tagline: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">City</label>
            <input value={shop.city} onChange={(e) => setShop({ ...shop, city: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={shop.description} onChange={(e) => setShop({ ...shop, description: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent min-h-[100px]" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Logo Image URL</label>
            <input value={shop.logoUrl} onChange={(e) => setShop({ ...shop, logoUrl: e.target.value })}
              placeholder="https://picsum.photos/seed/myshop-logo/200/200"
              className="w-full px-4 py-3 glass rounded-xl bg-transparent" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Banner Image URL</label>
            <input value={shop.bannerUrl} onChange={(e) => setShop({ ...shop, bannerUrl: e.target.value })}
              placeholder="https://picsum.photos/seed/myshop-banner/1200/400"
              className="w-full px-4 py-3 glass rounded-xl bg-transparent" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium disabled:opacity-50">
            {saving ? "Saving..." : "Save Shop"}
          </button>
        </form>
        {shop.slug && (
          <p className="mt-4 text-sm text-gray-400">
            Preview: <Link href={`/shops/${shop.slug}`} className="text-violet-400">/shops/{shop.slug}</Link>
          </p>
        )}
      </GlassCard>
    </div>
  );
}
