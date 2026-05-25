"""Export mesh to GLB format."""

from pathlib import Path
import numpy as np
from PIL import Image

try:
    import trimesh
except ImportError:
    trimesh = None

MAX_FACES = 8000


def mesh_to_glb(vertices: np.ndarray, faces: np.ndarray, vertex_colors: np.ndarray | None = None) -> bytes:
    if trimesh is None:
        raise RuntimeError("trimesh not installed")

    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    if vertex_colors is not None and len(vertex_colors) == len(vertices):
        mesh.visual.vertex_colors = vertex_colors

    if len(mesh.faces) > MAX_FACES:
        try:
            mesh = mesh.simplify_quadric_decimation(face_count=MAX_FACES)
        except Exception:
            pass

    return mesh.export(file_type="glb")


def mesh_to_glb_textured(
    vertices: np.ndarray,
    faces: np.ndarray,
    uvs: np.ndarray,
    texture_image: Image.Image,
) -> bytes:
    """Export GLB with embedded photo texture (photo-realistic twin)."""
    if trimesh is None:
        raise RuntimeError("trimesh not installed")

    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    mesh.visual = trimesh.visual.TextureVisuals(uv=uvs, image=texture_image)
    return mesh.export(file_type="glb")


def save_glb_bytes(data: bytes, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
