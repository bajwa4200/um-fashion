import { auth } from "@/lib/auth";
import { getGpuJob, isGpuWorkerOnline, updateGpuJob } from "@/lib/gpu-jobs";
import { gpuFetch, hasGpuWorker } from "@/lib/gpu-worker";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let job = await getGpuJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const online = await isGpuWorkerOnline();

  if (
    online &&
    hasGpuWorker() &&
    (job.status === "queued" || job.status === "processing")
  ) {
    try {
      const res = await gpuFetch(`/jobs/${id}`, { timeoutMs: 8000 });
      if (res.ok) {
        const remote = await res.json();
        if (remote.status === "completed" && remote.result) {
          job =
            (await updateGpuJob(id, {
              status: "completed",
              result: remote.result as Record<string, unknown>,
            })) ?? job;
        } else if (remote.status === "failed") {
          job =
            (await updateGpuJob(id, {
              status: "failed",
              error: String(remote.error ?? "GPU job failed"),
            })) ?? job;
        } else if (remote.status === "processing") {
          job = (await updateGpuJob(id, { status: "processing" })) ?? job;
        }
      }
    } catch {
      /* use local job state */
    }
  }

  return NextResponse.json({
    ...job,
    workerOnline: online,
  });
}
