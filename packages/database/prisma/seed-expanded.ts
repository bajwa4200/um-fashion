/** Generates 300+ catalog products with try-on assets and scenario tags. */

import { SCENARIO_TAG_POOL, tryOnImageForStep } from "./tryon-images";

type ProductSeed = {
  name: string;
  description: string;
  category: "CLOTHING" | "ACCESSORIES" | "FRAGRANCES" | "MAKEUP" | "FOOTWEAR";
  vendorPrice: number;
  outfitStep?: string;
  scenarioTags: string[];
  genderTarget: string;
  season?: string;
};

export const EXTRA_VENDORS = [
  { email: "pakistan@um.fashion", slug: "pakistan-couture", businessName: "Pakistan Couture", city: "Karachi" },
  { email: "lahore@um.fashion", slug: "lahore-luxury", businessName: "Lahore Luxury", city: "Lahore" },
  { email: "islamabad@um.fashion", slug: "capital-formal", businessName: "Capital Formal", city: "Islamabad" },
  { email: "eid@um.fashion", slug: "eid-collection", businessName: "Eid Collection", city: "Karachi" },
  { email: "cricket@um.fashion", slug: "cricket-casual", businessName: "Cricket Casual", city: "Lahore" },
  { email: "modest@um.fashion", slug: "modest-wear", businessName: "Modest Wear PK", city: "Islamabad" },
  { email: "budget@um.fashion", slug: "budget-bazaar", businessName: "Budget Bazaar", city: "Faisalabad" },
];

const STEPS = ["PANTS", "SHIRT", "JACKET", "FOOTWEAR", "HAT", "ACCESSORIES", "WATCHES"] as const;
const STEP_CATEGORY: Record<string, ProductSeed["category"]> = {
  PANTS: "CLOTHING",
  SHIRT: "CLOTHING",
  JACKET: "CLOTHING",
  FOOTWEAR: "FOOTWEAR",
  HAT: "ACCESSORIES",
  ACCESSORIES: "ACCESSORIES",
  WATCHES: "ACCESSORIES",
};

const NAME_PREFIX: Record<string, string[]> = {
  PANTS: ["Slim Chinos", "Formal Trouser", "Denim Jeans", "Cargo Pant", "Linen Pant"],
  SHIRT: ["Oxford Shirt", "Kurta Shirt", "Polo Tee", "Dress Shirt", "Linen Shirt"],
  JACKET: ["Blazer", "Bomber", "Waistcoat", "Overcoat", "Sherwani Jacket"],
  FOOTWEAR: ["Leather Loafer", "Sneaker", "Peshawari Chappal", "Formal Shoe", "Runner"],
  HAT: ["Fez Cap", "Baseball Cap", "Fedora", "Beanie"],
  ACCESSORIES: ["Leather Belt", "Crossbody Bag", "Scarf", "Cufflinks"],
  WATCHES: ["Steel Watch", "Sport Watch", "Dress Watch"],
};

export function generateExpandedProducts(vendorSlug: string, vendorCity: string): ProductSeed[] {
  const products: ProductSeed[] = [];
  let idx = 0;

  for (const step of STEPS) {
    const names = NAME_PREFIX[step] || ["Item"];
    for (let v = 0; v < 5; v++) {
      const nameBase = names[v % names.length];
      const tagSet = new Set<string>([
        SCENARIO_TAG_POOL[idx % SCENARIO_TAG_POOL.length],
        SCENARIO_TAG_POOL[(idx + 3) % SCENARIO_TAG_POOL.length],
        vendorCity.toLowerCase(),
      ]);
      if (step === "JACKET") tagSet.add("formal");
      if (vendorSlug.includes("budget")) tagSet.add("budget");
      if (vendorSlug.includes("modest")) tagSet.add("modest");
      if (vendorSlug.includes("eid")) tagSet.add("eid");
      if (vendorSlug.includes("cricket")) tagSet.add("casual");

      products.push({
        name: `${nameBase} ${vendorSlug} ${idx + 1}`,
        description: `${nameBase} for ${vendorCity} — ${step.toLowerCase()} step`,
        category: STEP_CATEGORY[step],
        vendorPrice: 25 + (idx % 20) * 5,
        outfitStep: step,
        scenarioTags: [...tagSet],
        genderTarget: idx % 3 === 0 ? "female" : idx % 3 === 1 ? "male" : "unisex",
        season: idx % 2 === 0 ? "summer" : "winter",
      });
      idx++;
    }
  }

  for (let f = 0; f < 8; f++) {
    products.push({
      name: `Perfume ${vendorSlug} ${f + 1}`,
      description: "Fragrance — wizard suggestion only",
      category: "FRAGRANCES",
      vendorPrice: 40 + f * 10,
      outfitStep: "FRAGRANCE",
      scenarioTags: ["party", "wedding", "luxury"],
      genderTarget: "unisex",
    });
  }

  return products;
}

export function productImageUrl(name: string, step: string, index: number): {
  images: string[];
  tryOnImageUrl: string | null;
} {
  const tryOn = tryOnImageForStep(step, index);
  const main = tryOn || `https://placehold.co/600x800/f8f8f8/333333/png?text=${encodeURIComponent(name.slice(0, 20))}`;
  return { images: [main], tryOnImageUrl: tryOn };
}
