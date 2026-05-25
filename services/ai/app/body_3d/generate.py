"""Generate 3D avatar GLB from full-body photo."""

import base64
import uuid
import time

import cv2
import numpy as np

from app.human_recon.router import generate_human_mesh_glb
from app.body_3d.s3_util import upload_bytes_best_effort


def generate_3d_avatar_sync(image_bytes: bytes, gender_hint: str | None = None) -> dict:
    """Synchronous pipeline for asyncio.to_thread."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        return {
            "success": False,
            "message": "Could not decode image",
            "rigData": {},
            "gender": gender_hint or "neutral",
        }

    try:
        glb_bytes, rig_data, smpl_params, mesh_mode = generate_human_mesh_glb(
            image_bytes, gender_hint
        )
    except ValueError as e:
        return {
            "success": False,
            "message": str(e),
            "rigData": {},
            "gender": gender_hint or "neutral",
        }

    glb_b64 = base64.b64encode(glb_bytes).decode()
    uid = uuid.uuid4().hex
    glb_url = upload_bytes_best_effort(glb_bytes, f"avatars/{uid}/body.glb", "model/gltf-binary")
    thumb_url = upload_bytes_best_effort(image_bytes, f"avatars/{uid}/photo.jpg", "image/jpeg")

    mode_label = {
        "replicate": " — neural 3D from your photo",
        "photo_texture": " — built from your photo",
        "smplx": " (SMPL-X body)",
    }.get(mesh_mode, " — digital twin ready")

    return {
        "success": True,
        "message": "Digital twin ready" + mode_label,
        "rigData": rig_data,
        "smplParams": smpl_params,
        "gender": rig_data.get("gender", gender_hint or "neutral"),
        "modelGlbUrl": glb_url,
        "modelThumbnail": thumb_url,
        "baseImageUrl": thumb_url,
        "glbBase64": glb_b64,
    }
