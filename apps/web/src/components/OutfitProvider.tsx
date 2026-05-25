"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface OutfitContextType {
  isOpen: boolean;
  openOutfit: () => void;
  closeOutfit: () => void;
}

const OutfitContext = createContext<OutfitContextType>({
  isOpen: false,
  openOutfit: () => {},
  closeOutfit: () => {},
});

export function OutfitProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openOutfit = useCallback(() => setIsOpen(true), []);
  const closeOutfit = useCallback(() => setIsOpen(false), []);

  return (
    <OutfitContext.Provider value={{ isOpen, openOutfit, closeOutfit }}>
      {children}
    </OutfitContext.Provider>
  );
}

export const useOutfit = () => useContext(OutfitContext);
