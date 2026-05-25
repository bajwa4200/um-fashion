from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_GPU_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = _GPU_ROOT.parent.parent

_ENV_FILES = [
    _GPU_ROOT / ".env",
    _REPO_ROOT / ".env",
    _REPO_ROOT / "apps" / "web" / ".env.local",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(p) for p in _ENV_FILES if p.exists()],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gpu_worker_secret: str = "change-me-gpu-secret"
    port: int = 8100
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_embed_model: str = "nomic-embed-text"
    chroma_path: str = "./chroma_data"

    upstash_redis_rest_url: str | None = None
    upstash_redis_rest_token: str | None = None

    blob_read_write_token: str | None = None
    s3_endpoint: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None
    s3_bucket: str = "um-uploads"
    s3_public_url: str | None = None

    human_mesh_mode: str = "cuda_volumetric"  # cuda_volumetric | triposr
    triposr_model_path: str = "./models/triposr"


settings = Settings()
