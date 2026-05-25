"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { OutfitProvider } from "@/components/OutfitProvider";
import { OutfitResume } from "@/components/OutfitResume";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OutfitProvider>
        <Suspense fallback={null}>
          <OutfitResume />
        </Suspense>
        {children}
      </OutfitProvider>
    </SessionProvider>
  );
}
