"""Ollama chat + streaming for GPU laptop."""

import json
from typing import AsyncIterator

import httpx

from app.chat.stylist import STYLIST_SYSTEM_PROMPT
from app.config import settings

_OLLAMA_ERRORS = (
    httpx.ConnectError,
    httpx.ReadError,
    httpx.TimeoutException,
    httpx.HTTPStatusError,
)


async def check_ollama_health() -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            r.raise_for_status()
            models = [m.get("name", "") for m in r.json().get("models", [])]
            return {"reachable": True, "models": models}
        except Exception as e:
            return {"reachable": False, "error": str(e), "models": []}


async def chat_completion(messages: list[dict], system_prompt: str | None = None) -> str:
    full = []
    if system_prompt:
        full.append({"role": "system", "content": system_prompt})
    full.extend(messages)

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            r = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                json={"model": settings.ollama_model, "messages": full, "stream": False},
            )
            r.raise_for_status()
            return r.json().get("message", {}).get("content", "") or _fallback(messages)
        except _OLLAMA_ERRORS:
            return _fallback(messages)


async def chat_stream(messages: list[dict]) -> AsyncIterator[str]:
    full = [{"role": "system", "content": STYLIST_SYSTEM_PROMPT}, *messages]
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            async with client.stream(
                "POST",
                f"{settings.ollama_base_url}/api/chat",
                json={"model": settings.ollama_model, "messages": full, "stream": True},
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if chunk.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue
        except _OLLAMA_ERRORS:
            yield _fallback(messages)


async def get_embedding(text: str) -> list[float]:
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            r = await client.post(
                f"{settings.ollama_base_url}/api/embeddings",
                json={"model": settings.ollama_embed_model, "prompt": text},
            )
            r.raise_for_status()
            return r.json().get("embedding", [])
        except _OLLAMA_ERRORS:
            return []


def _fallback(messages: list[dict]) -> str:
    last = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    low = last.lower()
    if any(w in low for w in ["shadi", "wedding", "baraat"]):
        return "Shadi ke liye best! Wizard mein pants, phir formal shirt aur jacket chuno. Karachi garmi ho to linen prefer karo."
    if "office" in low:
        return "Office look: slim chinos + crisp shirt. Neutrals safe hain. Agla step wizard mein chuno!"
    return "Batao — occasion kya hai aur kis city mein? Main perfect outfit suggest karunga!"
