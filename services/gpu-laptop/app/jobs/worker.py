"""Background worker — processes Redis job queue on GPU laptop."""

import asyncio
import base64
import logging

from app.jobs import redis_client
from app.jobs.handlers import process_job

logger = logging.getLogger("gpu-worker")


async def worker_loop(poll_interval: float = 2.0) -> None:
    if not redis_client.redis_enabled():
        logger.warning("Redis not configured — worker idle (sync API still works)")
        return

    logger.info("GPU job worker started")
    while True:
        job_id = await redis_client.pop_job_id()
        if not job_id:
            await asyncio.sleep(poll_interval)
            continue
        job = await redis_client.get_job(job_id)
        if not job or job.get("status") != "queued":
            continue
        await redis_client.update_job(job_id, status="processing")
        try:
            result = await process_job(job)
            await redis_client.update_job(job_id, status="completed", result=result)
        except Exception as e:
            logger.exception("Job %s failed", job_id)
            await redis_client.update_job(job_id, status="failed", error=str(e))
        await asyncio.sleep(0.1)
