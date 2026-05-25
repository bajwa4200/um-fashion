import { auth } from "@/lib/auth";
import { aiTryOn3d } from "@/lib/ai";
import { isDemoMode, DEMO_OUTFIT_MESSAGE } from "@/lib/demo-mode";
import { gpuFetch } from "@/lib/gpu-worker";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json(
      { success: false, demoMode: true, message: DEMO_OUTFIT_MESSAGE },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { photoBase64, rigData, garments, use3d } = body;

  if (!photoBase64) {
    return NextResponse.json({ error: "photoBase64 required" }, { status: 400 });
  }

  const wearable = (garments ?? []).filter(
    (g: { outfitStep: string }) => g.outfitStep !== "FRAGRANCE"
  );

  if (use3d && wearable.length > 0) {
    const last = wearable[wearable.length - 1];
    try {
      const result = await aiTryOn3d({
        photoBase64,
        rigData: rigData ?? {},
        garmentImageUrl: last.imageUrl,
        outfitStep: last.outfitStep,
      });
      if (result.success && result.previewImageBase64) {
        return NextResponse.json({
          success: true,
          imageBase64: result.previewImageBase64,
          mode: "3d",
        });
      }
    } catch {
      /* fall through to 2d */
    }
  }

  try {
    const res = await gpuFetch("/tryon/compose-2d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoBase64,
        rigData: rigData ?? {},
        garments: wearable,
      }),
      timeoutMs: 30_000,
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Try-on service error" });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({
      success: false,
      message: "Could not reach GPU/AI service for try-on",
    });
  }
}
