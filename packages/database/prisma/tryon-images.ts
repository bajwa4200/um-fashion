/** Curated garment-style images for virtual try-on (wearable steps only). */

export const TRYON_BY_STEP: Record<string, string[]> = {
  PANTS: [
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1473966962640-7e1d44f8a7d0?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop",
  ],
  SHIRT: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2b?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3f90?w=600&h=800&fit=crop",
  ],
  JACKET: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop",
  ],
  FOOTWEAR: [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1606107557195-0a737c8b4d2f?w=600&h=800&fit=crop",
  ],
  HAT: [
    "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=800&fit=crop",
  ],
  ACCESSORIES: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1622560292454-1eebc0d69844?w=600&h=800&fit=crop",
  ],
  WATCHES: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop",
  ],
};

export function tryOnImageForStep(step: string, index: number): string | null {
  const list = TRYON_BY_STEP[step];
  if (!list?.length) return null;
  return list[index % list.length];
}

export const SCENARIO_TAG_POOL = [
  "wedding",
  "office",
  "party",
  "gym",
  "casual",
  "eid",
  "formal",
  "summer",
  "winter",
  "modest",
  "luxury",
  "budget",
  "male",
  "female",
  "unisex",
  "karachi",
  "lahore",
];
