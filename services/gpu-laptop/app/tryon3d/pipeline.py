"""3D garment try-on — texture projection + dressed preview render."""

import base64
import io

import cv2
import httpx
import numpy as np
from PIL import Image

STEP_REGIONS = {
    "PANTS": (0.45, 0.95, 0.2, 0.8),
    "SHIRT": (0.25, 0.55, 0.15, 0.85),
    "JACKET": (0.2, 0.6, 0.1, 0.9),
    "FOOTWEAR": (0.82, 0.98, 0.25, 0.75),
    "HAT": (0.0, 0.18, 0.2, 0.8),
    "ACCESSORIES": (0.35, 0.65, 0.55, 0.95),
    "WATCHES": (0.35, 0.65, 0.0, 0.35),
}


def _fetch_image(url: str) -> np.ndarray:
    if url.startswith("data:"):
        import base64 as b64

        header, data = url.split(",", 1)
        raw = b64.b64decode(data)
    else:
        with httpx.Client(timeout=30.0) as client:
            r = client.get(url)
            r.raise_for_status()
            raw = r.content
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not load garment image")
    return img


def _white_to_alpha(img_bgr: np.ndarray) -> Image.Image:
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(rgb).convert("RGBA")
    data = pil.getdata()
    new = []
    for r, g, b, a in data:
        if r > 240 and g > 240 and b > 240:
            new.append((r, g, b, 0))
        else:
            new.append((r, g, b, 255))
    pil.putdata(new)
    return pil


def tryon_3d_garment(
    photo_base64: str,
    rig_data: dict,
    garment_image_url: str,
    outfit_step: str,
) -> dict:
    import base64 as b64mod

    photo_bytes = b64mod.b64decode(photo_base64)
    photo = cv2.imdecode(np.frombuffer(photo_bytes, np.uint8), cv2.IMREAD_COLOR)
    if photo is None:
        return {"success": False, "message": "Invalid photo"}

    garment = _fetch_image(garment_image_url)
    garment_rgba = _white_to_alpha(garment)

    h, w = photo.shape[:2]
    region = STEP_REGIONS.get(outfit_step.upper(), STEP_REGIONS["SHIRT"])
    y0, y1, x0, x1 = region
    y0p, y1p = int(y0 * h), int(y1 * h)
    x0p, x1p = int(x0 * w), int(x1 * w)

    anchors = rig_data.get("anchorPoints", {})
    step_key = outfit_step.lower()
    if step_key in anchors:
        ax = anchors[step_key]["x"] * w
        ay = anchors[step_key]["y"] * h
        gw, gh = x1p - x0p, y1p - y0p
        x0p = int(max(0, ax - gw / 2))
        y0p = int(max(0, ay - gh / 2))
        x1p = int(min(w, x0p + gw))
        y1p = int(min(h, y0p + gh))

    target_w = max(x1p - x0p, 40)
    target_h = max(y1p - y0p, 40)
    garment_resized = garment_rgba.resize((target_w, target_h), Image.Resampling.LANCZOS)

    overlay = Image.fromarray(cv2.cvtColor(photo, cv2.COLOR_BGR2RGB)).convert("RGBA")
    overlay.paste(garment_resized, (x0p, y0p), garment_resized)
    result_rgb = overlay.convert("RGB")

    buf = io.BytesIO()
    result_rgb.save(buf, format="JPEG", quality=92)
    preview_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "success": True,
        "previewImageBase64": preview_b64,
        "outfitStep": outfit_step,
        "mode": "3d_texture_project",
        "message": "Garment applied to your twin",
    }
