export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function picsum(seed: string, w = 600, h = 800): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export function picsumBanner(seed: string): string {
  return `https://picsum.photos/seed/${seed}-banner/1200/400`;
}

export function picsumLogo(seed: string): string {
  return `https://picsum.photos/seed/${seed}-logo/200/200`;
}
