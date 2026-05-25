"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { OUTFIT_STEPS, PRODUCT_CATEGORIES } from "@um/shared";
import { Upload, Loader2 } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "CLOTHING",
    vendorPrice: "",
    stock: "10",
    sizes: "S,M,L,XL",
    colors: "Black,White",
    images: "",
    outfitStep: "SHIRT",
  });
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/vendor/product-image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setForm((f) => ({ ...f, images: data.imageUrl }));
        setPreviewUrl(data.imageUrl);
      } else {
        alert(data.error || "Could not process image");
      }
    } catch {
      alert("Image processing failed. Start the AI service on port 8000.");
    } finally {
      setProcessingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        category: form.category,
        vendorPrice: parseFloat(form.vendorPrice),
        stock: parseInt(form.stock),
        sizes: form.sizes.split(",").map((s) => s.trim()),
        colors: form.colors.split(",").map((c) => c.trim()),
        images: form.images ? [form.images] : [],
        outfitStep: form.outfitStep,
      }),
    });

    if (res.ok) {
      router.push("/vendor/products");
    } else {
      alert("Failed to create product");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Add Product</h1>
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Product Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none min-h-[80px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Outfit Step</label>
            <select
              value={form.outfitStep}
              onChange={(e) => setForm({ ...form, outfitStep: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent"
            >
              {OUTFIT_STEPS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Your Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={form.vendorPrice}
              onChange={(e) => setForm({ ...form, vendorPrice: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Customer sees +15% markup</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Product Photo</label>
          <p className="text-xs text-gray-500 mb-3">
            Upload any photo — we auto-remove the background and place it on white with studio lighting.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processingImage}
            className="flex items-center gap-2 px-4 py-3 rounded-xl glass hover:glow-violet text-sm"
          >
            {processingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {processingImage ? "Processing..." : "Upload & auto white background"}
          </button>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Processed product"
              className="mt-3 w-40 h-52 object-contain rounded-xl border border-white/10 bg-white"
            />
          )}
          <input
            value={form.images.startsWith("data:") ? "" : form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            className="w-full mt-3 px-4 py-3 glass rounded-xl bg-transparent focus:outline-none text-sm"
            placeholder="Or paste image URL (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sizes (comma-separated)</label>
            <input
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Colors (comma-separated)</label>
            <input
              value={form.colors}
              onChange={(e) => setForm({ ...form, colors: e.target.value })}
              className="w-full px-4 py-3 glass rounded-xl bg-transparent focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !form.images}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
