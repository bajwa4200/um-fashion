"""MinIO/S3 helpers with short timeouts — never block avatar generation."""

import boto3
from botocore.client import Config as BotoConfig

from app.config import settings

_S3_CONFIG = BotoConfig(
    signature_version="s3v4",
    connect_timeout=2,
    read_timeout=5,
    retries={"max_attempts": 1},
)


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=_S3_CONFIG,
        region_name="us-east-1",
    )


def upload_bytes_best_effort(data: bytes, key: str, content_type: str) -> str | None:
    try:
        s3 = get_s3_client()
        s3.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{settings.s3_public_url}/{key}"
    except Exception:
        return None


def check_minio_reachable() -> bool:
    try:
        get_s3_client().head_bucket(Bucket=settings.s3_bucket)
        return True
    except Exception:
        return False
