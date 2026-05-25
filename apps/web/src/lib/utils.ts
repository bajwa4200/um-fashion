import { getDisplayPrice, getPlatformFee } from "@um/shared";

export { getDisplayPrice, getPlatformFee };

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function productToClient(
  product: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    vendorPrice: { toString(): string } | number;
    stock: number;
    sizes: string[];
    colors: string[];
    images: string[];
    outfitStep: string | null;
    vendor?: { businessName: string };
  },
  commissionRate = 0.15
) {
  const vendorPrice = Number(product.vendorPrice);
  return {
    ...product,
    vendorPrice,
    displayPrice: getDisplayPrice(vendorPrice, commissionRate),
    platformFee: getPlatformFee(vendorPrice, commissionRate),
  };
}
