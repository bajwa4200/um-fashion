"""Upload assets to Vercel Blob or S3-compatible storage."""

import uuid

import httpx

from app.config import settings


def upload_bytes(data: bytes, key: str, content_type: str) -> str | None:
    if settings.blob_read_write_token:
        return _upload_vercel_blob(data, key, content_type)
    if settings.s3_endpoint and settings.s3_access_key:
        return _upload_s3(data, key, content_type)
    return None


def _upload_vercel_blob(data: bytes, key: str, content_type: str) -> str | None:
    try:
        import json

        pathname = key.replace("/", "-")
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                f"https://blob.vercel-storage.com/{pathname}",
                content=data,
                headers={
                    "Authorization": f"Bearer {settings.blob_read_write_token}",
                    "x-content-type": content_type,
                    "x-api-version": "7",
                },
            )
            if r.status_code in (200, 201):
                return r.json().get("url")
    except Exception:
        pass
    return None


def _upload_s3(data: bytes, key: str, content_type: str) -> str | None:
    try:
        import boto3
        from botocore.client import Config

        client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=Config(signature_version="s3v4"),
        )
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        base = settings.s3_public_url or f"{settings.s3_endpoint}/{settings.s3_bucket}"
        return f"{base.rstrip('/')}/{key}"
    except Exception:
        return None


def new_asset_key(prefix: str, ext: str) -> str:
    return f"{prefix}/{uuid.uuid4().hex}.{ext}"
