"""Ollama LLM integration for outfit stylist chatbot."""

import httpx
from app.config import settings


def _ollama_errors():
    return (
        httpx.ConnectError,
        httpx.ReadError,
        httpx.WriteError,
        httpx.TimeoutException,
        httpx.HTTPStatusError,
        httpx.RemoteProtocolError,
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


async def chat_completion(
    messages: list[dict],
    system_prompt: str | None = None,
) -> str:
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                json={
                    "model": settings.ollama_model,
                    "messages": full_messages,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "")
            if content:
                return content
            return _fallback_response(messages)
        except _ollama_errors():
            return _fallback_response(messages)


async def get_embedding(text: str) -> list[float]:
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{settings.ollama_base_url}/api/embeddings",
                json={"model": settings.ollama_embed_model, "prompt": text},
            )
            response.raise_for_status()
            return response.json().get("embedding", [])
        except _ollama_errors():
            return []


def _fallback_response(messages: list[dict]) -> str:
    last_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        "",
    )
    lower = last_user.lower()

    if any(w in lower for w in ["shadi", "wedding", "baraat", "mehndi", "nikah"]):
        return (
            "Shadi ke liye best! Pehle pants/chinos, phir formal shirt aur jacket. "
            "Neeche se kapra chuno — Skip bhi kar sakte ho."
        )
    if any(w in lower for w in ["office", "meeting", "kaam"]):
        return (
            "Office look simple rakhte hain — smart pants aur clean shirt. "
            "Marketplace se neeche pick karo."
        )
    if any(w in lower for w in ["gym", "workout", "sport"]):
        return "Gym ke liye comfy active wear — neeche options dekho aur pick karo."
    if any(w in lower for w in ["party", "casual", "hangout"]):
        return "Party vibe! Relaxed outfit — neeche se apni pasand pick karo."

    if len(messages) <= 2:
        return (
            "Assalam o alaikum! Aap kahan ja rahe ho? "
            "Neeche button dabao: Shadi, Office, Party, ya Gym. "
            "Shehar: Karachi, Lahore, Islamabad."
        )

    return "Bohat acha! Neeche se kapra chuno ya Skip karo agla step ke liye."


STYLIST_SYSTEM_PROMPT = """You are UM Fashion's friendly stylist for Pakistan.
Speak in SIMPLE English mixed with Roman Urdu (easy words only).
Examples: Shadi, Office, Baraat, Karachi, Lahore, kapra, acha lag raha hai.
Rules:
- Max 2 short sentences per reply.
- User already has a digital twin photo — guide them to PICK clothes from the bar below.
- Never use complex English or long paragraphs.
- Occasion: Shadi/wedding, Office, Party, Gym, Casual.
- Cities: Karachi, Lahore, Islamabad, Faisalabad, Rawalpindi.
- When occasion is clear, tell them to pick from the product row below (not typing needed).
Be warm like a helpful shop assistant in Lahore, not a robot."""
