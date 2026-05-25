"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useOutfit } from "./OutfitProvider";

/** Re-opens Make Your Outfit after login when user started from the wizard. */
export function OutfitResume() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const { openOutfit } = useOutfit();

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const fromQuery = searchParams.get("openOutfit") === "1";
    const fromStorage =
      typeof window !== "undefined" && sessionStorage.getItem("outfitResume") === "1";

    if (fromQuery || fromStorage) {
      sessionStorage.removeItem("outfitResume");
      openOutfit();
    }
  }, [status, session, searchParams, openOutfit]);

  return null;
}
