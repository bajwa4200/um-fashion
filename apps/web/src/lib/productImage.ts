/** Normalize legacy image URLs and decide if Next optimizer should be bypassed. */

const SLOW_OR_EXTERNAL_HOSTS = new Set([
  "picsum.photos",
  "images.unsplash.com",
  "source.unsplash.com",
  "placehold.co",
]);

export function normalizeProductImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes("images.unsplash.com") || url.includes("source.unsplash.com")) {
    const seed = url.replace(/[^a-zA-Z0-9]/g, "").slice(-24) || "product";
    return `https://picsum.photos/seed/${seed}/600/800`;
  }
  return url;
}

export function shouldBypassImageOptimizer(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return SLOW_OR_EXTERNAL_HOSTS.has(host);
  } catch {
    return true;
  }
}
