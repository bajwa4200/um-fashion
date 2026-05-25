/** Client-safe demo flag (set NEXT_PUBLIC_DEMO_MODE=true on Vercel). */
export function isDemoModeClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
