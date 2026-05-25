import { auth } from "@/lib/auth";
import { createGpuJob, isGpuWorkerOnline, updateGpuJob } from "@/lib/gpu-jobs";
import { gpuFetch, hasGpuWorker } from "@/lib/gpu-worker";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, payload } = body as {
    type: "avatar3d" | "tryon3d" | "index_products";
    payload: Record<string, unknown>;
  };

  if (!type || !payload) {
    return NextResponse.json({ error: "type and payload required" }, { status: 400 });
  }

  const job = await createGpuJob(type, payload);
  const online = await isGpuWorkerOnline();

  if (online && hasGpuWorker()) {
    try {
      await gpuFetch("/jobs/enqueue", {
        method: "POST",
        body: JSON.stringify({ type, payload }),
        headers: { "Content-Type": "application/json" },
        timeoutMs: 10_000,
      });
      await gpuFetch(`/jobs/${job.id}/process`, {
        method: "POST",
        timeoutMs: 300_000,
      });
      const statusRes = await gpuFetch(`/jobs/${job.id}`, { timeoutMs: 10_000 });
      if (statusRes.ok) {
        const remote = await statusRes.json();
        if (remote.status === "completed") {
          await updateGpuJob(job.id, { status: "completed", result: remote.result });
        }
        return NextResponse.json({
          jobId: job.id,
          status: remote.status,
          result: remote.result,
          workerOnline: true,
          message:
            remote.status === "completed"
              ? "GPU processing complete"
              : "Processing on GPU laptop",
        });
      }
    } catch {
      /* fall through to queued */
    }
  }

  return NextResponse.json({
    jobId: job.id,
    status: "queued",
    workerOnline: online,
    message: online
      ? "Job queued — GPU laptop will process shortly"
      : "GPU laptop offline — job queued. Start services/gpu-laptop on your RTX machine.",
  });
}
