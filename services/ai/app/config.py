from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_AI_ROOT = Path(__file__).resolve().parents[1]  # services/ai
_REPO_ROOT = _AI_ROOT.parent.parent  # D:\Programs\um

_ENV_FILES = (
    _AI_ROOT / ".env",
    _REPO_ROOT / ".env",
    _REPO_ROOT / "apps" / "web" / ".env.local",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(p) for p in _ENV_FILES if p.exists()],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2:3b"
    ollama_embed_model: str = "nomic-embed-text"
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin123"
    s3_bucket: str = "um-uploads"
    s3_public_url: str = "http://localhost:9000/um-uploads"
    chroma_path: str = "./chroma_data"
    avatar_use_smplx: bool = False
    replicate_api_token: str | None = None
    replicate_model: str = "fofr/instant-mesh"
    human_recon_backend: str = "auto"  # auto | replicate | local


settings = Settings()
