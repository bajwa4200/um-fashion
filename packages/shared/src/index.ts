export const DEFAULT_COMMISSION_RATE = 0.15;

export function getDisplayPrice(
  vendorPrice: number,
  commissionRate = DEFAULT_COMMISSION_RATE
): number {
  return Math.round(vendorPrice * (1 + commissionRate) * 100) / 100;
}

export function getPlatformFee(
  vendorPrice: number,
  commissionRate = DEFAULT_COMMISSION_RATE
): number {
  return Math.round(vendorPrice * commissionRate * 100) / 100;
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export const OUTFIT_STEPS = [
  { key: "PANTS", label: "Pants / Bottom", labelUr: "Pants / Trouser", icon: "👖" },
  { key: "SHIRT", label: "Shirt / Top", labelUr: "Shirt / Kameez top", icon: "👕" },
  { key: "JACKET", label: "Jacket / Outerwear", labelUr: "Jacket / Coat", icon: "🧥" },
  { key: "FOOTWEAR", label: "Footwear", labelUr: "Joota / Shoes", icon: "👟" },
  { key: "HAT", label: "Hat / Headwear", labelUr: "Topi / Cap", icon: "🧢" },
  { key: "ACCESSORIES", label: "Accessories", labelUr: "Accessories", icon: "👜" },
  { key: "WATCHES", label: "Watches / Jewelry", labelUr: "Ghari / Jewelry", icon: "⌚" },
  { key: "FRAGRANCE", label: "Fragrance / Makeup", labelUr: "Perfume / Makeup", icon: "✨" },
] as const;

export const OCCASION_CHIPS = [
  { value: "wedding", label: "Shadi", labelEn: "Wedding" },
  { value: "office", label: "Office", labelEn: "Office" },
  { value: "party", label: "Party", labelEn: "Party" },
  { value: "gym", label: "Gym", labelEn: "Gym" },
  { value: "casual", label: "Casual", labelEn: "Casual" },
] as const;

export const CITY_CHIPS = ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi"] as const;

export {
  SCENARIO_TAGS,
  SCENARIO_TEMPLATES,
  QUICK_REPLY_CHIPS,
  expandScenarioQueries,
} from "./fashion-scenarios";
export type { ScenarioTag, ScenarioTemplate } from "./fashion-scenarios";

export type OutfitStepKey = (typeof OUTFIT_STEPS)[number]["key"];

export const PRODUCT_CATEGORIES = [
  { key: "CLOTHING", label: "Clothing" },
  { key: "ACCESSORIES", label: "Accessories" },
  { key: "FRAGRANCES", label: "Fragrances" },
  { key: "MAKEUP", label: "Makeup" },
  { key: "FOOTWEAR", label: "Footwear" },
] as const;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  displayPrice: number;
  image: string;
  reason: string;
}

export interface AvatarRigData {
  gender: "male" | "female" | "neutral";
  bodyScale: number;
  bodyHeight: number;
  shoulderWidth: number;
  landmarks: Record<string, { x: number; y: number }>;
  anchorPoints: {
    pants: { x: number; y: number };
    shirt: { x: number; y: number };
    jacket: { x: number; y: number };
    footwear: { x: number; y: number };
    hat: { x: number; y: number };
    accessories: { x: number; y: number };
    watches: { x: number; y: number };
  };
}

export { slugify, picsum, picsumBanner, picsumLogo } from "./shop-utils";
