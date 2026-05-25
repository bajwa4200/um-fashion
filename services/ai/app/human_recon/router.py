"""Route human mesh generation: Replicate first, local fallback."""

import logging

import cv2
import numpy as np

from app.config import settings
from app.human_recon.replicate_backend import generate_replicate_glb
from app.body_3d.glb_export import mesh_to_glb, mesh_to_glb_textured
from app.body_3d.smpl_fitter import fit_body_from_image

logger = logging.getLogger("um-ai.human_recon")


def _enrich_rig_anchors(rig: dict, w: int, h: int) -> dict:
    """Ensure anchorPoints exist for try-on compositing."""
    if rig.get("anchorPoints"):
        return rig
    ls = rig.get("leftShoulder", {})
    rs = rig.get("rightShoulder", {})
    lh = rig.get("leftHip", {})
    rh = rig.get("rightHip", {})
    la = rig.get("leftAnkle", {})
    ra = rig.get("rightAnkle", {})
    nose = rig.get("nose", {})
    if not ls or not rs:
        return rig
    cx = (ls["x"] + rs["x"]) / 2
    shoulder_y = (ls["y"] + rs["y"]) / 2
    hip_y = (lh["y"] + rh["y"]) / 2
    ankle_y = (la["y"] + ra["y"]) / 2
    head_y = nose.get("y", shoulder_y - 80)
    sw = abs(rs["x"] - ls["x"]) or 200
    rig["anchorPoints"] = {
        "pants": {"x": round(cx, 2), "y": round(hip_y, 2)},
        "shirt": {"x": round(cx, 2), "y": round(shoulder_y + 40, 2)},
        "jacket": {"x": round(cx, 2), "y": round(shoulder_y, 2)},
        "footwear": {"x": round(cx, 2), "y": round(ankle_y, 2)},
        "hat": {"x": round(cx, 2), "y": round(head_y - 30, 2)},
        "accessories": {"x": round(cx + sw * 0.4, 2), "y": round(hip_y, 2)},
        "watches": {"x": round(rig.get("leftWrist", {}).get("x", cx), 2),
                     "y": round(rig.get("leftWrist", {}).get("y", hip_y), 2)},
    }
    rig["shoulderWidth"] = rig.get("shoulderWidth", sw)
    return rig


def _glb_from_fit(fit: dict) -> bytes:
    if fit.get("texture_image") is not None and fit.get("uvs") is not None:
        return mesh_to_glb_textured(
            fit["vertices"], fit["faces"], fit["uvs"], fit["texture_image"]
        )
    return mesh_to_glb(fit["vertices"], fit["faces"], fit["vertex_colors"])


def generate_human_mesh_glb(
    image_bytes: bytes,
    gender_hint: str | None = None,
) -> tuple[bytes, dict, dict, str]:
    """
    Returns (glb_bytes, rig_data, smpl_params, mesh_mode).
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError("Could not decode image")

    h, w = image_bgr.shape[:2]
    fit = fit_body_from_image(image_bgr)
    if gender_hint and gender_hint in ("male", "female"):
        fit["gender"] = gender_hint

    rig_data = _enrich_rig_anchors(fit["rigData"], w, h)
    smpl_params = dict(fit.get("smplParams", {}))

    backend = settings.human_recon_backend.lower()
    use_replicate = backend in ("auto", "replicate") and bool(settings.replicate_api_token)

    if use_replicate:
        glb = generate_replicate_glb(image_bytes)
        if glb:
            smpl_params["meshMode"] = "replicate"
            smpl_params["usedSmplx"] = False
            logger.info("Human recon: replicate OK (%d bytes)", len(glb))
            return glb, rig_data, smpl_params, "replicate"
        logger.info("Human recon: replicate failed, using local fallback")

    glb_bytes = _glb_from_fit(fit)
    mode = smpl_params.get("meshMode", "photo_texture")
    return glb_bytes, rig_data, smpl_params, mode
