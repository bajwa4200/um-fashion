"""Full 3D avatar generation on GPU laptop."""

import base64
import io

import cv2
import numpy as np
from PIL import Image

from app.config import settings
from app.human3d.glb_export import export_textured_glb
from app.human3d.mesh_cuda import build_volumetric_mesh, try_triposr_mesh
from app.human3d.rig import build_rig_from_image, segment_person
from app.storage import new_asset_key, upload_bytes


def generate_avatar_3d(image_bytes: bytes, gender_hint: str | None = None) -> dict:
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        return {"success": False, "message": "Could not decode image", "rigData": {}}

    try:
        rig = build_rig_from_image(image, gender_hint)
        seg = segment_person(image)
    except ValueError as e:
        return {"success": False, "message": str(e), "rigData": {}}

    mesh_mode = "cuda_volumetric"
    glb_bytes: bytes

    triposr = try_triposr_mesh(image, settings.triposr_model_path)
    if triposr and settings.human_mesh_mode == "triposr":
        glb_bytes, mesh_mode = triposr[0], triposr[1]
    else:
        verts, faces, uvs, tex = build_volumetric_mesh(image, rig, seg)
        glb_bytes = export_textured_glb(verts, faces, uvs, tex)

    thumb_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    thumb_pil.thumbnail((512, 768))
    thumb_buf = io.BytesIO()
    thumb_pil.save(thumb_buf, format="JPEG", quality=88)
    thumb_bytes = thumb_buf.getvalue()

    glb_b64 = base64.b64encode(glb_bytes).decode()
    thumb_b64 = base64.b64encode(thumb_bytes).decode()

    glb_key = new_asset_key("avatars", "glb")
    thumb_key = new_asset_key("avatars", "jpg")
    glb_url = upload_bytes(glb_bytes, glb_key, "model/gltf-binary")
    thumb_url = upload_bytes(thumb_bytes, thumb_key, "image/jpeg")

    return {
        "success": True,
        "message": f"Digital twin ready — full 3D ({mesh_mode})",
        "meshMode": mesh_mode,
        "rigData": rig,
        "smplParams": {},
        "gender": rig.get("gender", gender_hint or "neutral"),
        "modelGlbUrl": glb_url,
        "modelThumbnail": thumb_url,
        "baseImageUrl": thumb_url,
        "thumbnailBase64": thumb_b64,
        "glbBase64": glb_b64,
    }
