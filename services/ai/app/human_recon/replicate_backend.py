"""Neural image-to-3D via Replicate API (InstantMesh-class models)."""

import io
import logging
import tempfile
from pathlib import Path

import httpx

from app.config import settings

logger = logging.getLogger("um-ai.replicate")

def _resolve_model() -> str:
    return (settings.replicate_model or "fofr/instant-mesh").strip()


def generate_replicate_glb(image_bytes: bytes) -> bytes | None:
    """
    Run Replicate image-to-mesh; return GLB bytes or None on failure.
    Requires REPLICATE_API_TOKEN in environment / .env.
    """
    token = settings.replicate_api_token
    if not token:
        return None

    try:
        import replicate
    except ImportError:
        logger.warning("replicate package not installed")
        return None

    client = replicate.Client(api_token=token)
    model = _resolve_model()

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        logger.info("Replicate human recon: model=%s", model)
        # instant-mesh style models accept `image` file path or URL
        output = client.run(
            model,
            input={"image": open(tmp_path, "rb")},
        )
    except Exception as e:
        logger.warning("Replicate run failed: %s", e)
        return None
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    url = _extract_mesh_url(output)
    if not url:
        logger.warning("Replicate output had no mesh URL: %s", type(output))
        return None

    return _download_bytes(url)


def _extract_mesh_url(output) -> str | None:
    if isinstance(output, str) and output.startswith("http"):
        return output
    if isinstance(output, list) and output:
        first = output[0]
        if isinstance(first, str) and first.startswith("http"):
            return first
    if isinstance(output, dict):
        for key in ("mesh", "model", "glb", "output", "model_file"):
            val = output.get(key)
            if isinstance(val, str) and val.startswith("http"):
                return val
    return None


def _download_bytes(url: str, timeout: float = 120.0) -> bytes | None:
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            r = client.get(url)
            r.raise_for_status()
            data = r.content
            if len(data) < 500:
                return None
            return data
    except Exception as e:
        logger.warning("Download mesh failed: %s", e)
        return None
