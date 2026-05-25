"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface LayeredItem {
  step: string;
  image: string;
  name: string;
}

interface AvatarViewerProps {
  baseImageUrl?: string | null;
  gender?: string;
  layeredItems?: LayeredItem[];
  isWaving?: boolean;
  isTryingOn?: boolean;
}

export function AvatarViewer({
  baseImageUrl,
  gender = "neutral",
  layeredItems = [],
  isWaving = false,
  isTryingOn = false,
}: AvatarViewerProps) {
  const skinTone = gender === "female" ? "#d4a574" : "#c9956c";
  const underwearColor = gender === "female" ? "#8b5cf6" : "#3b82f6";

  return (
    <div className="relative w-full max-w-xs mx-auto aspect-[3/5]">
      <motion.div
        animate={
          isWaving
            ? { rotate: [0, 2, -2, 2, 0], y: [0, -5, 0] }
            : isTryingOn
            ? { scale: [1, 1.02, 1], rotate: [0, 3, -3, 0] }
            : { y: [0, -3, 0] }
        }
        transition={{
          duration: isWaving ? 1.5 : isTryingOn ? 0.8 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full h-full glass rounded-3xl overflow-hidden glow-violet"
      >
        {baseImageUrl ? (
          <Image
            src={baseImageUrl}
            alt="Your avatar"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <svg viewBox="0 0 200 400" className="w-full h-full">
            {/* Head */}
            <motion.ellipse
              cx="100"
              cy="60"
              rx="30"
              ry="35"
              fill={skinTone}
              animate={isWaving ? { rotate: [0, 5, 0] } : {}}
              style={{ transformOrigin: "100px 95px" }}
            />
            {/* Body */}
            <rect x="70" y="95" width="60" height="80" rx="10" fill={skinTone} />
            {/* Underwear top */}
            <rect x="75" y="100" width="50" height="35" rx="5" fill={underwearColor} opacity="0.8" />
            {/* Underwear bottom */}
            <rect x="75" y="170" width="50" height="30" rx="5" fill={underwearColor} opacity="0.8" />
            {/* Arms */}
            <motion.rect
              x="45"
              y="100"
              width="20"
              height="70"
              rx="10"
              fill={skinTone}
              animate={
                isWaving
                  ? { rotate: [0, -30, 0, -30, 0], transformOrigin: "55px 100px" }
                  : {}
              }
            />
            <rect x="135" y="100" width="20" height="70" rx="10" fill={skinTone} />
            {/* Legs */}
            <rect x="75" y="200" width="22" height="120" rx="8" fill={skinTone} />
            <rect x="103" y="200" width="22" height="120" rx="8" fill={skinTone} />
            {/* Eyes */}
            <circle cx="88" cy="55" r="3" fill="#333" />
            <circle cx="112" cy="55" r="3" fill="#333" />
            {/* Smile */}
            <path d="M 90 68 Q 100 75 110 68" stroke="#333" strokeWidth="2" fill="none" />
          </svg>
        )}

        <AnimatePresence>
          {layeredItems.map((item, i) => (
            <motion.div
              key={`${item.step}-${i}`}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 0.85, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={160}
                  height={160}
                  className="object-contain drop-shadow-lg"
                  unoptimized
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {layeredItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex flex-wrap gap-2 justify-center"
        >
          {layeredItems.map((item) => (
            <span
              key={item.step}
              className="px-2 py-1 glass rounded-full text-xs text-violet-300"
            >
              {item.name}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
}
