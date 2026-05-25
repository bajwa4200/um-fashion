/**
 * Vercel client demo: marketplace works without GPU laptop / local AI.
 */

export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (process.env.VERCEL === "1" && !process.env.GPU_WORKER_URL) return true;
  return false;
}

export const DEMO_OUTFIT_MESSAGE =
  "3D outfit stylist runs on your GPU laptop (RTX 4060). This demo link includes the full marketplace — shops, products, cart, and login.";

export const DEMO_AI_UNAVAILABLE = {
  demoMode: true as const,
  success: false,
  message: DEMO_OUTFIT_MESSAGE,
};
