import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatCurrency } from "@um/shared";
import { normalizeProductImageUrl, shouldBypassImageOptimizer } from "@/lib/productImage";
import { AddToCartButton } from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const commissionRate = await getCommissionRate();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { vendor: { select: { businessName: true, id: true } } },
  });

  if (!product || !product.isActive) notFound();

  const client = productToClient(product, commissionRate);
  const mainImage = client.images[0] ? normalizeProductImageUrl(client.images[0]) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square glass rounded-2xl overflow-hidden">
          {mainImage && (
            <Image
              src={mainImage}
              alt={client.name}
              fill
              unoptimized={shouldBypassImageOptimizer(mainImage)}
              className="object-cover"
              priority
            />
          )}
        </div>
        <div>
          <p className="text-cyan-400 text-sm uppercase tracking-wider mb-2">
            {client.category}
          </p>
          <h1 className="font-display text-4xl font-bold mb-2">{client.name}</h1>
          <p className="text-gray-400 mb-1">by {product.vendor.businessName}</p>
          <p className="font-display text-3xl font-bold text-gradient mb-6">
            {formatCurrency(client.displayPrice)}
          </p>
          <p className="text-gray-400 mb-6">{client.description}</p>

          {client.sizes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Sizes</p>
              <div className="flex gap-2 flex-wrap">
                {client.sizes.map((s) => (
                  <span key={s} className="px-3 py-1 glass rounded-full text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {client.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Colors</p>
              <div className="flex gap-2 flex-wrap">
                {client.colors.map((c) => (
                  <span key={c} className="px-3 py-1 glass rounded-full text-sm">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-4">
            {client.stock > 0 ? `${client.stock} in stock` : "Out of stock"}
          </p>

          <AddToCartButton productId={client.id} disabled={client.stock <= 0} />

          <p className="text-xs text-gray-500 mt-4">
            Vendor price: {formatCurrency(client.vendorPrice)} + 15% platform fee
          </p>
        </div>
      </div>
    </div>
  );
}
