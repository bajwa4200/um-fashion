import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export async function getCommissionRate(): Promise<number> {
  const { prisma } = await import("./prisma");
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  return settings ? Number(settings.commissionRate) : 0.15;
}
