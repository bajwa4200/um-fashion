"""UM Fashion GPU laptop API — port 8100."""

import asyncio
import base64
import logging

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.auth import verify_gpu_secret
from app.chat.ollama import chat_completion, chat_stream, check_ollama_health
from app.chat.stylist import STYLIST_SYSTEM_PROMPT
from app.config import settings
from app.human3d.pipeline import generate_avatar_3d
from app.jobs import redis_client
from app.jobs.handlers import process_job
from app.rag.products import index_products, recommend_products
from app.tryon3d.pipeline import tryon_3d_garment

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("gpu-laptop")

_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

app = FastAPI(title="UM Fashion GPU Worker", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cuda_available() -> bool:
    try:
        import torch

        return torch.cuda.is_available()
    except Exception:
        return False


@app.on_event("startup")
async def startup():
    asyncio.create_task(_maybe_start_worker())
    logger.info("GPU laptop ready cuda=%s ollama=%s", _cuda_available(), settings.ollama_base_url)


async def _maybe_start_worker():
    from app.jobs.worker import worker_loop

    await asyncio.sleep(1)
    await worker_loop()


class ChatRequest(BaseModel):
    messages: list[dict]
    occasion: str | None = None


class IndexProductsRequest(BaseModel):
    products: list[dict]


class RecommendRequest(BaseModel):
    query: str
    outfitStep: str | None = None
    occasion: str | None = None
    nResults: int = 6


class TryOn3DRequest(BaseModel):
    photoBase64: str
    rigData: dict = {}
    garmentImageUrl: str
    outfitStep: str


class JobEnqueueRequest(BaseModel):
    type: str
    payload: dict


@app.get("/health")
async def health():
    ollama = await check_ollama_health()
    return {
        "status": "ok",
        "service": "gpu-laptop",
        "cuda": _cuda_available(),
        "ollama": ollama,
        "redis": redis_client.redis_enabled(),
        "meshMode": settings.human_mesh_mode,
    }


@app.post("/chat")
async def chat(req: ChatRequest, _: None = Depends(verify_gpu_secret)):
    reply = await chat_completion(req.messages, STYLIST_SYSTEM_PROMPT)
    return {"reply": reply}


@app.post("/chat/stream")
async def chat_stream_endpoint(req: ChatRequest, _: None = Depends(verify_gpu_secret)):
    async def gen():
        async for token in chat_stream(req.messages):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.post("/products/index")
async def products_index(req: IndexProductsRequest, _: None = Depends(verify_gpu_secret)):
    count = await index_products(req.products)
    return {"indexed": count}


@app.post("/recommend")
async def recommend(req: RecommendRequest, _: None = Depends(verify_gpu_secret)):
    results = await recommend_products(
        req.query, req.outfitStep, req.occasion, req.nResults
    )
    return {"recommendations": results}


@app.post("/avatar/generate3d")
async def avatar_generate_3d(
    file: UploadFile = File(...),
    gender: str | None = None,
    _: None = Depends(verify_gpu_secret),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    image_bytes = await file.read()
    return await asyncio.to_thread(generate_avatar_3d, image_bytes, gender)


@app.post("/tryon/3d")
async def tryon_3d(req: TryOn3DRequest, _: None = Depends(verify_gpu_secret)):
    return await asyncio.to_thread(
        tryon_3d_garment,
        req.photoBase64,
        req.rigData,
        req.garmentImageUrl,
        req.outfitStep,
    )


@app.post("/tryon/compose-2d")
async def tryon_compose_2d_proxy(
    req: dict,
    _: None = Depends(verify_gpu_secret),
):
    """Proxy to same logic as services/ai compose — import at runtime if available."""
    try:
        import sys
        from pathlib import Path

        ai_root = Path(__file__).resolve().parents[2] / "ai"
        if str(ai_root) not in sys.path:
            sys.path.insert(0, str(ai_root))
        from app.tryon_compose import compose_outfit_on_photo

        photo_b64 = req.get("photoBase64", "")
        photo_bytes = base64.b64decode(photo_b64)
        jpeg = compose_outfit_on_photo(
            photo_bytes,
            req.get("rigData", {}),
            req.get("garments", []),
        )
        return {
            "success": True,
            "imageBase64": base64.b64encode(jpeg).decode(),
        }
    except Exception as e:
        raise HTTPException(500, str(e)) from e


@app.post("/jobs/enqueue")
async def jobs_enqueue(req: JobEnqueueRequest, _: None = Depends(verify_gpu_secret)):
    job_id = await redis_client.enqueue_job(req.type, req.payload)
    job = await redis_client.get_job(job_id)
    if not job and not redis_client.redis_enabled():
        result = await process_job({"type": req.type, "payload": req.payload})
        return {"jobId": job_id, "status": "completed", "result": result, "sync": True}
    return {"jobId": job_id, "status": "queued"}


@app.get("/jobs/{job_id}")
async def jobs_status(job_id: str, _: None = Depends(verify_gpu_secret)):
    job = await redis_client.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@app.post("/jobs/{job_id}/process")
async def jobs_process_now(job_id: str, _: None = Depends(verify_gpu_secret)):
    """Process a queued job immediately (laptop online)."""
    job = await redis_client.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    await redis_client.update_job(job_id, status="processing")
    try:
        result = await process_job(job)
        await redis_client.update_job(job_id, status="completed", result=result)
        return await redis_client.get_job(job_id)
    except Exception as e:
        await redis_client.update_job(job_id, status="failed", error=str(e))
        raise HTTPException(500, str(e)) from e
