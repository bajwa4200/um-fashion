from fastapi import Header, HTTPException

from app.config import settings


def verify_gpu_secret(authorization: str | None = Header(None)) -> None:
    if not settings.gpu_worker_secret or settings.gpu_worker_secret == "change-me-gpu-secret":
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing GPU worker authorization")
    token = authorization[7:].strip()
    if token != settings.gpu_worker_secret:
        raise HTTPException(403, "Invalid GPU worker token")
