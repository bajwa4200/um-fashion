import { isDemoMode } from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    status: "ok",
    demoMode: isDemoMode(),
    database: dbOk ? "connected" : "error",
    gpuWorkerConfigured: Boolean(process.env.GPU_WORKER_URL),
  });
}
