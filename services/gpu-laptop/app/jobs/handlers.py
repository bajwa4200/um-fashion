"""Job type handlers."""

import base64

from app.human3d.pipeline import generate_avatar_3d
from app.rag.products import index_products
from app.tryon3d.pipeline import tryon_3d_garment


async def process_job(job: dict) -> dict:
    t = job.get("type")
    payload = job.get("payload") or {}

    if t == "avatar3d":
        image_b64 = payload.get("imageBase64", "")
        gender = payload.get("gender")
        image_bytes = base64.b64decode(image_b64)
        return generate_avatar_3d(image_bytes, gender)

    if t == "tryon3d":
        return tryon_3d_garment(
            payload.get("photoBase64", ""),
            payload.get("rigData", {}),
            payload.get("garmentImageUrl", ""),
            payload.get("outfitStep", "SHIRT"),
        )

    if t == "index_products":
        count = await index_products(payload.get("products", []))
        return {"indexed": count}

    raise ValueError(f"Unknown job type: {t}")
