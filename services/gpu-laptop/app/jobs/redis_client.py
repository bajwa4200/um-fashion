"""Upstash Redis REST client for job queue."""

import json
import time
import uuid
from typing import Any
from urllib.parse import quote

import httpx

from app.config import settings

QUEUE_KEY = "gpu:queue"
JOB_PREFIX = "gpu:job:"


def redis_enabled() -> bool:
    return bool(settings.upstash_redis_rest_url and settings.upstash_redis_rest_token)


def _encode(val: str) -> str:
    return quote(val, safe="")


async def _redis_request(command: str, *args: str) -> Any:
    if not redis_enabled():
        return None
    base = settings.upstash_redis_rest_url.rstrip("/")
    path = "/".join([command.lower(), *[_encode(str(a)) for a in args]])
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{base}/{path}",
            headers={"Authorization": f"Bearer {settings.upstash_redis_rest_token}"},
        )
        r.raise_for_status()
        data = r.json()
        return data.get("result")


async def enqueue_job(job_type: str, payload: dict) -> str:
    job_id = uuid.uuid4().hex
    job = {
        "id": job_id,
        "type": job_type,
        "status": "queued",
        "payload": payload,
        "result": None,
        "error": None,
        "createdAt": int(time.time()),
    }
    if redis_enabled():
        await _redis_request("SET", f"{JOB_PREFIX}{job_id}", json.dumps(job))
        await _redis_request("RPUSH", QUEUE_KEY, job_id)
    return job_id


async def get_job(job_id: str) -> dict | None:
    if not redis_enabled():
        return None
    raw = await _redis_request("GET", f"{JOB_PREFIX}{job_id}")
    if not raw:
        return None
    return json.loads(raw) if isinstance(raw, str) else raw


async def update_job(job_id: str, **fields: Any) -> None:
    job = await get_job(job_id)
    if not job:
        return
    job.update(fields)
    if redis_enabled():
        await _redis_request("SET", f"{JOB_PREFIX}{job_id}", json.dumps(job))


async def pop_job_id() -> str | None:
    if not redis_enabled():
        return None
    result = await _redis_request("LPOP", QUEUE_KEY)
    return result if isinstance(result, str) else None
