"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, User, Sparkles, Menu, X } from "lucide-react";
import { useOutfit } from "./OutfitProvider";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { data: session } = useSession();
  const { openOutfit } = useOutfit();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-display text-2xl font-bold text-gradient">
            UM Fashion
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="text-sm text-gray-300 hover:text-white transition-colors">
              Shop
            </Link>
            <Link href="/shops" className="text-sm text-gray-300 hover:text-white transition-colors">
              Shops
            </Link>
            <Link href="/shop/CLOTHING" className="text-sm text-gray-300 hover:text-white transition-colors hidden lg:block">
              Clothing
            </Link>
            <Link href="/shop/FRAGRANCES" className="text-sm text-gray-300 hover:text-white transition-colors hidden lg:block">
              Fragrances
            </Link>
          </div>

          <motion.div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openOutfit}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Make Your Outfit
            </motion.button>

            <Link href="/cart" className="p-2 text-gray-300 hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </Link>

            {session ? (
              <div className="relative group">
                <button className="p-2 text-gray-300 hover:text-white">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/10">
                    {session.user.email}
                  </div>
                  <Link href="/orders" className="block px-4 py-2 text-sm hover:bg-white/5">
                    My Orders
                  </Link>
                  {session.user.role === "VENDOR" && (
                    <Link href="/vendor" className="block px-4 py-2 text-sm hover:bg-white/5">
                      Vendor Dashboard
                    </Link>
                  )}
                  {session.user.role === "SUPERADMIN" && (
                    <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-white/5">
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-red-400"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              className="md:hidden p-2 text-gray-300"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/5 px-4 py-4 space-y-3"
          >
            <Link href="/shop" className="block text-sm text-gray-300" onClick={() => setMobileOpen(false)}>
              Shop
            </Link>
            <button
              onClick={() => { openOutfit(); setMobileOpen(false); }}
              className="flex items-center gap-2 text-sm text-violet-400"
            >
              <Sparkles className="w-4 h-4" /> Make Your Outfit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
