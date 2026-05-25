import { isDemoMode, DEMO_AI_UNAVAILABLE } from "@/lib/demo-mode";
import { aiHeaders, getAiBaseUrl, gpuFetch, hasGpuWorker } from "@/lib/gpu-worker";

const AI_BASE = getAiBaseUrl();

export async function aiChat(messages: { role: string; content: string }[]) {
  if (isDemoMode()) {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const low = last.toLowerCase();
    if (/shadi|wedding|baraat/.test(low)) {
      return {
        reply:
          "Shadi ke liye best! (Demo mode) GPU laptop setup se 3D stylist chalega. Abhi marketplace browse karo.",
      };
    }
    return {
      reply:
        "Hey! This is the marketplace demo. For 3D outfit AI, follow the GPU laptop setup guide on /gpu-setup.",
    };
  }
  try {
    const res = await gpuFetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      timeoutMs: 120_000,
    });
    if (!res.ok) {
      return { reply: "Hey twin! Tell me where you're going and what city!" };
    }
    return res.json() as Promise<{ reply: string }>;
  } catch {
    return { reply: "Hey twin! Tell me where you're going and what city!" };
  }
}

export async function aiChatStream(
  messages: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  if (isDemoMode()) return null;
  if (!hasGpuWorker()) return null;
  try {
    const res = await gpuFetch("/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      timeoutMs: 120_000,
    });
    if (!res.ok || !res.body) return null;
    return res.body;
  } catch {
    return null;
  }
}

export async function aiRecommend(params: {
  query: string;
  outfitStep?: string;
  occasion?: string;
  nResults?: number;
}) {
  if (isDemoMode()) throw new Error("AI recommend disabled in demo mode");
  const res = await gpuFetch("/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: params.query,
      outfitStep: params.outfitStep,
      occasion: params.occasion,
      nResults: params.nResults ?? 6,
    }),
    timeoutMs: 15_000,
  });
  if (!res.ok) throw new Error("AI recommend failed");
  return res.json() as Promise<{ recommendations: ProductRec[] }>;
}

export async function aiWeather(location: string) {
  if (isDemoMode()) return { temp: 28, condition: "sunny", location };
  const res = await fetch(`${AI_BASE}/weather`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify({ location }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

export async function aiIndexProducts(products: Record<string, unknown>[]) {
  if (isDemoMode()) return { indexed: 0 };
  const res = await gpuFetch("/products/index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
    timeoutMs: 120_000,
  });
  if (!res.ok) return { indexed: 0 };
  return res.json();
}

export interface AvatarGenerateResult {
  success: boolean;
  message?: string;
  rigData?: Record<string, unknown>;
  smplParams?: Record<string, unknown>;
  gender?: string;
  modelGlbUrl?: string | null;
  modelThumbnail?: string | null;
  baseImageUrl?: string | null;
  thumbnailBase64?: string | null;
  glbBase64?: string | null;
  meshMode?: string;
  avatarId?: string;
  jobId?: string;
  status?: string;
}

export async function aiGenerateAvatar(formData: FormData): Promise<AvatarGenerateResult> {
  if (isDemoMode()) {
    return { ...DEMO_AI_UNAVAILABLE };
  }
  try {
    const res = await gpuFetch("/avatar/generate3d", {
      method: "POST",
      body: formData,
      timeoutMs: 300_000,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message:
          (err as { detail?: string }).detail ||
          `Avatar service unavailable. Start GPU laptop (services/gpu-laptop) or CPU AI (services/ai).`,
      };
    }
    return res.json() as Promise<AvatarGenerateResult>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return {
        success: false,
        message:
          "Creating your digital twin took too long. Ensure GPU laptop is running or try a smaller photo.",
      };
    }
    return {
      success: false,
      message: hasGpuWorker()
        ? "Could not reach GPU worker. Run services/gpu-laptop and set GPU_WORKER_URL tunnel."
        : "Could not reach AI service. cd services/ai && python run.py",
    };
  }
}

export async function aiTryOn3d(params: {
  photoBase64: string;
  rigData: Record<string, unknown>;
  garmentImageUrl: string;
  outfitStep: string;
}) {
  if (isDemoMode()) throw new Error("3D try-on disabled in demo mode");
  const res = await gpuFetch("/tryon/3d", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    timeoutMs: 60_000,
  });
  if (!res.ok) throw new Error("3D try-on failed");
  return res.json();
}

export interface ProductRec {
  id: string;
  name: string;
  displayPrice: number;
  image: string;
  reason: string;
  category?: string;
  outfitStep?: string;
}
