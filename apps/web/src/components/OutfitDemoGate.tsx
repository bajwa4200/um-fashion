"use client";

import Link from "next/link";
import { Sparkles, Store, ShoppingCart, User, Laptop, ExternalLink } from "lucide-react";
import { useOutfit } from "./OutfitProvider";

export function OutfitDemoGate() {
  const { closeOutfit } = useOutfit();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center max-w-lg mx-auto">
      <Sparkles className="w-14 h-14 text-violet-400 mb-4" />
      <h3 className="font-display text-2xl font-bold text-gradient mb-3">
        3D outfit stylist — GPU laptop
      </h3>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        This share link is the <strong className="text-white">full marketplace demo</strong>. Browse
        shops, add to cart, and sign in. Photo upload, 3D digital twin, and AI stylist need your RTX
        4060 laptop setup (one-time, step-by-step guide).
      </p>

      <ul className="text-left text-sm text-gray-300 space-y-3 mb-8 w-full">
        <li className="flex gap-3 items-start">
          <Store className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <span>Works now: vendors, products, categories, search</span>
        </li>
        <li className="flex gap-3 items-start">
          <ShoppingCart className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <span>Works now: cart and checkout flow (demo Stripe)</span>
        </li>
        <li className="flex gap-3 items-start">
          <User className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <span>Works now: login as demo user or vendor</span>
        </li>
        <li className="flex gap-3 items-start">
          <Laptop className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <span>Needs GPU laptop: Make Your Outfit 3D + AI chat</span>
        </li>
      </ul>

      <Link
        href="/gpu-setup"
        onClick={() => closeOutfit()}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium flex items-center justify-center gap-2 mb-3"
      >
        Open GPU setup guide <ExternalLink className="w-4 h-4" />
      </Link>
      <button
        type="button"
        onClick={closeOutfit}
        className="text-sm text-gray-500 hover:text-white"
      >
        Continue browsing marketplace
      </button>
    </div>
  );
}
