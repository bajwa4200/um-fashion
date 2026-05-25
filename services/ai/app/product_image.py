"""Vendor product photo → white background studio look."""

import io
import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageOps


def process_vendor_product_photo(image_bytes: bytes, size: tuple[int, int] = (800, 1000)) -> bytes:
    """
    Center product on white canvas with even lighting.
    Uses simple segmentation when rembg is unavailable.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Invalid image file")

    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(rgb).convert("RGBA")

    try:
        from rembg import remove

        cutout = Image.open(io.BytesIO(remove(image_bytes))).convert("RGBA")
        pil = cutout
    except Exception:
        # Fallback: grabCut rough foreground
        mask = np.zeros(bgr.shape[:2], np.uint8)
        h, w = bgr.shape[:2]
        rect = (int(w * 0.08), int(h * 0.05), int(w * 0.84), int(h * 0.9))
        bgd = np.zeros((1, 65), np.float64)
        fgd = np.zeros((1, 65), np.float64)
        cv2.grabCut(bgr, mask, rect, bgd, fgd, 3, cv2.GC_INIT_WITH_RECT)
        fg = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
        pil.putalpha(Image.fromarray(fg * 255))

    pil = ImageEnhance.Brightness(pil).enhance(1.08)
    pil = ImageEnhance.Contrast(pil).enhance(1.05)

    canvas = Image.new("RGBA", size, (255, 255, 255, 255))
    pil.thumbnail((int(size[0] * 0.88), int(size[1] * 0.88)), Image.LANCZOS)
    x = (size[0] - pil.width) // 2
    y = (size[1] - pil.height) // 2
    canvas.paste(pil, (x, y), pil)

    out = canvas.convert("RGB")
    buf = io.BytesIO()
    out.save(buf, format="JPEG", quality=92, optimize=True)
    return buf.getvalue()
