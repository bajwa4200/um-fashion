/**
 * Routes AI calls to GPU laptop worker or local CPU fallback.
 */

const GPU_WORKER_URL = process.env.GPU_WORKER_URL?.replace(/\/$/, "");
const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);
const GPU_SECRET = process.env.GPU_WORKER_SECRET || "";

export function hasGpuWorker(): boolean {
  return Boolean(GPU_WORKER_URL);
}

export function getAiBaseUrl(): string {
  return hasGpuWorker() ? GPU_WORKER_URL! : AI_SERVICE_URL;
}

export function aiHeaders(contentType = "application/json"): HeadersInit {
  const h: Record<string, string> = {};
  if (contentType) h["Content-Type"] = contentType;
  if (hasGpuWorker() && GPU_SECRET) {
    h.Authorization = `Bearer ${GPU_SECRET}`;
  }
  return h;
}

export async function gpuFetch(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const base = getAiBaseUrl();
  const timeout = init?.timeoutMs ?? 240_000;
  const { timeoutMs: _, ...rest } = init ?? {};
  return fetch(`${base}${path}`, {
    ...rest,
    headers: { ...aiHeaders(), ...(rest.headers as Record<string, string>) },
    signal: AbortSignal.timeout(timeout),
  });
}
