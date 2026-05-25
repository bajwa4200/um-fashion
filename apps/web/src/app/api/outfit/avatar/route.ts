import { auth } from "@/lib/auth";
import { aiGenerateAvatar } from "@/lib/ai";
import { isDemoMode, DEMO_OUTFIT_MESSAGE } from "@/lib/demo-mode";
import { createGpuJob, isGpuWorkerOnline } from "@/lib/gpu-jobs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Prisma } from "@um/database";

export const maxDuration = 300;

async function saveAvatar(
  userId: string,
  result: Awaited<ReturnType<typeof aiGenerateAvatar>>
) {
  const rigData = (result.rigData ?? {}) as Prisma.InputJsonValue;
  const smplParams = (result.smplParams ?? {}) as Prisma.InputJsonValue;
  const thumb =
    result.thumbnailBase64
      ? `data:image/jpeg;base64,${result.thumbnailBase64}`
      : result.baseImageUrl ?? result.modelThumbnail;

  return prisma.avatar.upsert({
    where: { userId },
    update: {
      rigData,
      baseImageUrl: thumb,
      gender: result.gender,
      modelGlbUrl: result.modelGlbUrl,
      modelThumbnail: thumb,
      smplParams,
    },
    create: {
      userId,
      rigData,
      baseImageUrl: thumb,
      gender: result.gender,
      modelGlbUrl: result.modelGlbUrl,
      modelThumbnail: thumb,
      smplParams,
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json(
      {
        success: false,
        demoMode: true,
        message: DEMO_OUTFIT_MESSAGE,
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const gender = formData.get("gender")?.toString() || null;

    const online = await isGpuWorkerOnline();

    if (!online && process.env.GPU_WORKER_URL) {
      if (file instanceof Blob) {
        const buf = Buffer.from(await file.arrayBuffer());
        const imageBase64 = buf.toString("base64");
        const job = await createGpuJob("avatar3d", { imageBase64, gender });
        return NextResponse.json({
          success: false,
          queued: true,
          jobId: job.id,
          status: "queued",
          message:
            "GPU laptop offline — job queued. Start services/gpu-laptop on your RTX machine, then refresh.",
        });
      }
    }

    const result = await aiGenerateAvatar(formData);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message:
          result.message ||
          "Could not create your digital twin. Try another full-body A-pose photo.",
      });
    }

    const avatar = await saveAvatar(session.user.id, result);
    return NextResponse.json({ ...result, avatarId: avatar.id });
  } catch (e) {
    console.error("Avatar route error:", e);
    return NextResponse.json({
      success: false,
      message: "Something went wrong while creating your digital twin. Please try again.",
    });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avatar = await prisma.avatar.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(avatar);
}
