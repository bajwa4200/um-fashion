"""Phase 4: GPU-based virtual try-on (OOTDiffusion / CatVTON).

Requires NVIDIA CUDA GPU or cloud GPU worker.
Not supported on AMD RX580 — use layered 2D avatar try-on instead.

To enable when hardware is available:
1. Install PyTorch with CUDA
2. Clone OOTDiffusion or CatVTON
3. Wire into /tryon/gpu endpoint with Redis job queue
"""

async def queue_gpu_tryon(user_photo_url: str, garment_url: str, product_id: str) -> dict:
    return {
        "status": "unavailable",
        "message": "GPU try-on requires NVIDIA CUDA. Use 2D layered avatar in Phase 1.",
        "productId": product_id,
    }
