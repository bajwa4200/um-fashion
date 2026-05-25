"""Photo-realistic digital twin: textured mesh from segmented full-body photo."""

import json
import time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from app.body_3d.texture import _rig_bbox

_DEBUG_LOG = Path(__file__).resolve().parents[4] / "debug-46bc0c.log"


def _dbg(location: str, message: str, data: dict, hypothesis_id: str) -> None:
    # #region agent log
    try:
        with open(_DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(
                json.dumps(
                    {
                        "sessionId": "46bc0c",
                        "location": location,
                        "message": message,
                        "data": data,
                        "hypothesisId": hypothesis_id,
                        "timestamp": int(time.time() * 1000),
                    }
                )
                + "\n"
            )
    except Exception:
        pass
    # #endregion


def build_photo_realistic_mesh(
    image_bgr: np.ndarray,
    rig: dict,
    seg_mask: np.ndarray,
    grid_w: int = 64,
    grid_h: int = 128,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, Image.Image]:
    """
    Build a depth-relief mesh with the user's photo as GLB texture.
    Looks like the reference photo from the front; subtle depth for rotation.
    """
    h_img, w_img = image_bgr.shape[:2]
    min_x, min_y, max_x, max_y = _rig_bbox(rig)
    x0, y0 = int(max(0, min_x)), int(max(0, min_y))
    x1, y1 = int(min(w_img, max_x)), int(min(h_img, max_y))

    if x1 - x0 < 20 or y1 - y0 < 20:
        raise ValueError("Could not isolate body region for photo twin.")

    crop_bgr = image_bgr[y0:y1, x0:x1].copy()
    mask = np.clip(seg_mask[y0:y1, x0:x1], 0, 1)
    ch, cw = crop_bgr.shape[:2]

    m = (mask > 0.5).astype(np.uint8)
    if m.sum() < 100:
        m = np.ones((ch, cw), dtype=np.uint8)

    dist = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    if dist.max() > 0:
        dist = dist / dist.max()

    rgba = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = (mask * 255).astype(np.uint8)
    texture_image = Image.fromarray(rgba)

    aspect = cw / max(ch, 1)
    height_units = 1.8

    vertices: list[list[float]] = []
    uvs: list[list[float]] = []
    index_map: dict[tuple[int, int], int] = {}

    for i in range(grid_h):
        for j in range(grid_w):
            u = j / max(grid_w - 1, 1)
            v = i / max(grid_h - 1, 1)
            px = min(int(u * (cw - 1)), cw - 1)
            py = min(int(v * (ch - 1)), ch - 1)
            if m[py, px] < 0.5:
                continue
            x = (u - 0.5) * aspect * height_units * 0.55
            y = (0.5 - v) * height_units
            z = float(dist[py, px]) * 0.12
            index_map[(i, j)] = len(vertices)
            vertices.append([x, y, z])
            uvs.append([u, 1.0 - v])

    if len(vertices) < 4:
        raise ValueError("Segmentation too small — use a clearer full-body photo.")

    faces: list[list[int]] = []
    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            k00 = index_map.get((i, j))
            k10 = index_map.get((i + 1, j))
            k01 = index_map.get((i, j + 1))
            k11 = index_map.get((i + 1, j + 1))
            if k00 is None or k10 is None or k01 is None:
                continue
            faces.append([k00, k10, k01])
            if k11 is None:
                continue
            faces.append([k01, k10, k11])

    _dbg(
        "photo_mesh.py:built",
        "photo realistic mesh",
        {"verts": len(vertices), "faces": len(faces), "cropW": cw, "cropH": ch},
        "F",
    )

    return (
        np.array(vertices, dtype=np.float64),
        np.array(faces, dtype=np.int64),
        np.array(uvs, dtype=np.float64),
        texture_image,
    )
