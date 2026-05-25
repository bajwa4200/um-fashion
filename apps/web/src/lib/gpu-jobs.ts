/**
 * GPU job queue — Upstash Redis (Vercel) with in-memory fallback for local dev.
 */

import { randomBytes } from "crypto";

export type GpuJobType = "avatar3d" | "tryon3d" | "index_products";
export type GpuJobStatus = "queued" | "processing" | "completed" | "failed";

export interface GpuJob {
  id: string;
  type: GpuJobType;
  status: GpuJobStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  error?: string | null;
  createdAt: number;
}

const JOB_PREFIX = "gpu:job:";
const QUEUE_KEY = "gpu:queue";

const memoryJobs = new Map<string, GpuJob>();
const memoryQueue: string[] = [];

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function redisCmd(command: string, ...args: string[]): Promise<unknown> {
  const base = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const encoded = [command.toLowerCase(), ...args.map((a) => encodeURIComponent(a))].join(
    "/"
  );
  const res = await fetch(`${base}/${encoded}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Redis error: ${res.status}`);
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

export async function createGpuJob(
  type: GpuJobType,
  payload: Record<string, unknown>
): Promise<GpuJob> {
  const id = randomBytes(16).toString("hex");
  const job: GpuJob = {
    id,
    type,
    status: "queued",
    payload,
    result: null,
    error: null,
    createdAt: Date.now(),
  };

  if (redisConfigured()) {
    await redisCmd("SET", `${JOB_PREFIX}${id}`, JSON.stringify(job));
    await redisCmd("RPUSH", QUEUE_KEY, id);
  } else {
    memoryJobs.set(id, job);
    memoryQueue.push(id);
  }

  return job;
}

export async function getGpuJob(id: string): Promise<GpuJob | null> {
  if (redisConfigured()) {
    const raw = await redisCmd("GET", `${JOB_PREFIX}${id}`);
    if (!raw || typeof raw !== "string") return null;
    return JSON.parse(raw) as GpuJob;
  }
  return memoryJobs.get(id) ?? null;
}

export async function updateGpuJob(
  id: string,
  patch: Partial<Pick<GpuJob, "status" | "result" | "error">>
): Promise<GpuJob | null> {
  const job = await getGpuJob(id);
  if (!job) return null;
  Object.assign(job, patch);
  if (redisConfigured()) {
    await redisCmd("SET", `${JOB_PREFIX}${id}`, JSON.stringify(job));
  } else {
    memoryJobs.set(id, job);
  }
  return job;
}

export async function popGpuJobId(): Promise<string | null> {
  if (redisConfigured()) {
    const id = await redisCmd("LPOP", QUEUE_KEY);
    return typeof id === "string" ? id : null;
  }
  return memoryQueue.shift() ?? null;
}

export async function isGpuWorkerOnline(): Promise<boolean> {
  const url = process.env.GPU_WORKER_URL;
  if (!url) return false;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
