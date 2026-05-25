"""Export textured mesh to GLB."""

import io

import numpy as np
import trimesh
from PIL import Image


def export_textured_glb(
    vertices: np.ndarray,
    faces: np.ndarray,
    uvs: np.ndarray,
    texture: Image.Image,
    max_faces: int = 12000,
) -> bytes:
    if len(faces) > max_faces:
        step = max(1, len(faces) // max_faces)
        faces = faces[::step]

    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    uv_count = min(len(uvs), len(vertices))
    mesh.visual = trimesh.visual.TextureVisuals(
        uv=uvs[:uv_count],
        image=texture,
    )

    glb = io.BytesIO()
    mesh.export(file_obj=glb, file_type="glb")
    return glb.getvalue()
