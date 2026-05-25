import asyncio
import logging

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.ollama_client import chat_completion, STYLIST_SYSTEM_PROMPT, check_ollama_health
from app.rag import index_products, recommend_products
from app.avatar import generate_avatar
from app.body_3d.generate import generate_3d_avatar_sync
from app.product_image import process_vendor_product_photo
from app.body_3d.smpl_fitter import preload_smplx_models, smplx_models_available
from app.body_3d.s3_util import check_minio_reachable
from app.weather import get_weather
from app.tryon_compose import compose_outfit_on_photo
from app.config import settings
from app.human_recon.replicate_backend import _resolve_model

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("um-ai")

app = FastAPI(title="UM Fashion AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_avatar3d_ready = {"smplx": False, "minio": False, "replicate": False}


@app.on_event("startup")
async def startup():
    global _avatar3d_ready
    _avatar3d_ready["minio"] = check_minio_reachable()
    if smplx_models_available():
        loaded = await asyncio.to_thread(preload_smplx_models)
        _avatar3d_ready["smplx"] = any(loaded.values())
        logger.info("SMPL-X preload: %s", loaded)
    else:
        logger.info("SMPL-X models not found — using parametric + photo texture fallback")
    _avatar3d_ready["replicate"] = bool(settings.replicate_api_token)
    logger.info(
        "Human recon: backend=%s replicate_token=%s model=%s",
        settings.human_recon_backend,
        _avatar3d_ready["replicate"],
        _resolve_model() if _avatar3d_ready["replicate"] else "n/a",
    )
    logger.info("MinIO reachable: %s", _avatar3d_ready["minio"])


class ChatRequest(BaseModel):
    messages: list[dict]
    occasion: str | None = None
    location: str | None = None


class ChatResponse(BaseModel):
    reply: str


class IndexProductsRequest(BaseModel):
    products: list[dict]


class RecommendRequest(BaseModel):
    query: str
    outfitStep: str | None = None
    occasion: str | None = None
    nResults: int = 6


class WeatherRequest(BaseModel):
    location: str


class GpuTryOnRequest(BaseModel):
    """Phase 4 placeholder — requires NVIDIA GPU or cloud worker."""
    userPhotoUrl: str
    garmentImageUrl: str
    productId: str


class GarmentItem(BaseModel):
    outfitStep: str
    imageUrl: str


class TryOnComposeRequest(BaseModel):
    photoBase64: str | None = None
    rigData: dict = {}
    garments: list[GarmentItem] = []


@app.get("/health")
async def health():
    ollama = await check_ollama_health()
    return {
        "status": "ok",
        "service": "um-ai",
        "ollama": ollama,
        "avatar3d": _avatar3d_ready,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    reply = await chat_completion(req.messages, STYLIST_SYSTEM_PROMPT)
    return ChatResponse(reply=reply)


@app.post("/products/index")
async def products_index(req: IndexProductsRequest):
    count = await index_products(req.products)
    return {"indexed": count}


@app.post("/recommend")
async def recommend(req: RecommendRequest):
    results = await recommend_products(
        query=req.query,
        outfit_step=req.outfitStep,
        occasion=req.occasion,
        n_results=req.nResults,
    )
    return {"recommendations": results}


@app.post("/products/process-image")
async def products_process_image(file: UploadFile = File(...)):
    """White-background studio product photo for vendor uploads."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    image_bytes = await file.read()
    try:
        processed = await asyncio.to_thread(process_vendor_product_photo, image_bytes)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    import base64

    return {
        "success": True,
        "imageBase64": base64.b64encode(processed).decode(),
        "contentType": "image/jpeg",
    }


@app.post("/avatar/generate3d")
async def avatar_generate_3d(
    file: UploadFile = File(...),
    gender: str | None = None,
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    image_bytes = await file.read()
    result = await asyncio.to_thread(generate_3d_avatar_sync, image_bytes, gender)
    return result


@app.post("/avatar/generate")
async def avatar_generate(
    file: UploadFile = File(...),
    gender: str | None = None,
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    image_bytes = await file.read()
    result = await generate_avatar(image_bytes, gender)
    return result


@app.post("/weather")
async def weather(req: WeatherRequest):
    data = await get_weather(req.location)
    return data


@app.post("/tryon/compose-2d")
async def tryon_compose_2d(req: TryOnComposeRequest):
    """Composite selected garments onto user's photo using body anchors."""
    if not req.photoBase64:
        raise HTTPException(400, "photoBase64 required")
    import base64

    try:
        photo_bytes = base64.b64decode(req.photoBase64)
    except Exception as e:
        raise HTTPException(400, "Invalid photoBase64") from e

    garments = [g.model_dump() for g in req.garments]
    try:
        jpeg = await asyncio.to_thread(
            compose_outfit_on_photo,
            photo_bytes,
            req.rigData,
            garments,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    return {
        "success": True,
        "imageBase64": base64.b64encode(jpeg).decode(),
        "contentType": "image/jpeg",
    }


@app.post("/tryon/gpu")
async def gpu_tryon(req: GpuTryOnRequest):
    """Phase 4: OOTDiffusion/CatVTON async try-on — requires NVIDIA GPU."""
    return {
        "status": "queued",
        "message": (
            "GPU try-on is queued for Phase 4. "
            "Requires NVIDIA CUDA GPU or cloud worker. "
            "Using layered 2D avatar try-on in the meantime."
        ),
        "jobId": None,
        "productId": req.productId,
    }
