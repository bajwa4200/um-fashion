"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "violet" | "cyan" | "none";
}

export function GlassCard({ children, className, glow = "none" }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "glass rounded-2xl p-6",
        glow === "violet" && "glow-violet",
        glow === "cyan" && "glow-cyan",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
