import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { ProductGrid } from "@/components/ProductGrid";
import { PRODUCT_CATEGORIES } from "@um/shared";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ category?: string[] }>;
}) {
  const resolved = await params;
  const category = resolved.category?.[0];
  const commissionRate = await getCommissionRate();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category: category as never } : {}),
    },
    include: { vendor: { select: { businessName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const clientProducts = products.map((p) => productToClient(p, commissionRate));
  const categoryLabel =
    PRODUCT_CATEGORIES.find((c) => c.key === category)?.label || "All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-2">{categoryLabel}</h1>
      <p className="text-gray-400 mb-8">{products.length} products</p>

      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/shop"
          className={`px-4 py-2 rounded-full text-sm ${!category ? "bg-violet-600 text-white" : "glass text-gray-300"}`}
        >
          All
        </Link>
        {PRODUCT_CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={`/shop/${cat.key}`}
            className={`px-4 py-2 rounded-full text-sm ${
              category === cat.key ? "bg-violet-600 text-white" : "glass text-gray-300"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <ProductGrid products={clientProducts} />
    </div>
  );
}
