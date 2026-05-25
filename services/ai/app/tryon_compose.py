"""2D virtual try-on: composite marketplace garments onto user's photo."""

import base64
import io
from typing import Any

import cv2
import httpx
import numpy as np
from PIL import Image

STEP_TO_ANCHOR = {
    "PANTS": "pants",
    "SHIRT": "shirt",
    "JACKET": "jacket",
    "FOOTWEAR": "footwear",
    "HAT": "hat",
    "ACCESSORIES": "accessories",
    "WATCHES": "watches",
    "FRAGRANCE": "shirt",
}

# Draw order (back to front)
LAYER_ORDER = ["PANTS", "SHIRT", "JACKET", "FOOTWEAR", "HAT", "ACCESSORIES", "WATCHES", "FRAGRANCE"]

SIZES = {
    "PANTS": (0.55, 0.38),
    "SHIRT": (0.5, 0.28),
    "JACKET": (0.58, 0.32),
    "FOOTWEAR": (0.35, 0.12),
    "HAT": (0.35, 0.14),
    "ACCESSORIES": (0.25, 0.2),
    "WATCHES": (0.15, 0.1),
    "FRAGRANCE": (0.2, 0.15),
}


def _fetch_image(url: str) -> Image.Image | None:
    if url.startswith("data:"):
        import re

        m = re.match(r"data:image/[^;]+;base64,(.+)", url)
        if m:
            return Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert("RGBA")
        return None
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            r = client.get(url)
            r.raise_for_status()
            return Image.open(io.BytesIO(r.content)).convert("RGBA")
    except Exception:
        return None


def _white_to_alpha(img: Image.Image) -> Image.Image:
    arr = np.array(img)
    if arr.shape[2] < 4:
        rgb = arr[:, :, :3]
        white = np.all(rgb > 240, axis=2)
        alpha = np.where(white, 0, 255).astype(np.uint8)
        arr = np.dstack([rgb, alpha])
        return Image.fromarray(arr)
    return img


def compose_outfit_on_photo(
    photo_bytes: bytes,
    rig_data: dict,
    garments: list[dict[str, Any]],
) -> bytes:
    """
    garments: [{outfitStep, imageUrl}, ...]
    Returns JPEG bytes of composited dressed photo.
    """
    nparr = np.frombuffer(photo_bytes, np.uint8)
    base_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if base_bgr is None:
        raise ValueError("Invalid photo")

    h, w = base_bgr.shape[:2]
    canvas = Image.fromarray(cv2.cvtColor(base_bgr, cv2.COLOR_BGR2RGB)).convert("RGBA")
    anchors = rig_data.get("anchorPoints") or {}

    sorted_garments = sorted(
        garments,
        key=lambda g: LAYER_ORDER.index(g["outfitStep"])
        if g.get("outfitStep") in LAYER_ORDER
        else 99,
    )

    for g in sorted_garments:
        step = g.get("outfitStep", "SHIRT")
        url = g.get("imageUrl") or g.get("image")
        if not url:
            continue
        garment = _fetch_image(url)
        if garment is None:
            continue
        garment = _white_to_alpha(garment)

        anchor_key = STEP_TO_ANCHOR.get(step, "shirt")
        pt = anchors.get(anchor_key, anchors.get("shirt", {"x": w / 2, "y": h / 2}))
        ax, ay = float(pt["x"]), float(pt["y"])

        rel_w, rel_h = SIZES.get(step, (0.4, 0.3))
        gw = int(w * rel_w)
        gh = int(h * rel_h)
        garment = garment.resize((gw, gh), Image.LANCZOS)

        px = int(ax - gw / 2)
        py = int(ay - gh / 2)
        canvas.paste(garment, (px, py), garment)

    out_rgb = canvas.convert("RGB")
    buf = io.BytesIO()
    out_rgb.save(buf, format="JPEG", quality=92)
    return buf.getvalue()
