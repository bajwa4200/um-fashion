"""Project photo colors onto mesh vertices for a realistic digital twin look."""

import numpy as np
import cv2


def _rig_bbox(rig: dict) -> tuple[float, float, float, float]:
    points = [
        rig["nose"],
        rig["leftShoulder"],
        rig["rightShoulder"],
        rig["leftHip"],
        rig["rightHip"],
        rig["leftAnkle"],
        rig["rightAnkle"],
    ]
    xs = [p["x"] for p in points]
    ys = [p["y"] for p in points]
    pad_x = (max(xs) - min(xs)) * 0.15
    pad_y = (max(ys) - min(ys)) * 0.08
    return min(xs) - pad_x, min(ys) - pad_y, max(xs) + pad_x, max(ys) + pad_y


def project_photo_colors(
    vertices: np.ndarray,
    image_bgr: np.ndarray,
    rig: dict,
    seg_mask: np.ndarray | None = None,
) -> np.ndarray:
    """Sample RGB from the photo at each vertex position (mapped via body bbox)."""
    h, w = image_bgr.shape[:2]
    min_x, min_y, max_x, max_y = _rig_bbox(rig)

    vx = vertices[:, 0]
    vy = vertices[:, 1]
    v_min_x, v_max_x = float(vx.min()), float(vx.max())
    v_min_y, v_max_y = float(vy.min()), float(vy.max())

    span_x = v_max_x - v_min_x + 1e-6
    span_y = v_max_y - v_min_y + 1e-6

    px = ((vx - v_min_x) / span_x * (max_x - min_x) + min_x).astype(np.int32)
    py = ((vy - v_min_y) / span_y * (max_y - min_y) + min_y).astype(np.int32)
    px = np.clip(px, 0, w - 1)
    py = np.clip(py, 0, h - 1)

    bgr = image_bgr[py, px]
    colors = np.zeros((len(vertices), 4), dtype=np.uint8)
    colors[:, :3] = bgr[:, ::-1]  # BGR -> RGB
    colors[:, 3] = 255

    if seg_mask is not None:
        mask = seg_mask > 0.5
        on_body = mask[py, px]
        colors[~on_body, 3] = 200
        # Slight blend toward skin tone off-segmentation
        colors[~on_body, :3] = (colors[~on_body, :3] * 0.6 + np.array([200, 170, 150]) * 0.4).astype(
            np.uint8
        )

    return colors


def resize_image_max_height(image_bgr: np.ndarray, max_height: int = 720) -> np.ndarray:
    h, w = image_bgr.shape[:2]
    if h <= max_height:
        return image_bgr
    scale = max_height / h
    new_w = int(w * scale)
    return cv2.resize(image_bgr, (new_w, max_height), interpolation=cv2.INTER_AREA)
