"""Chroma RAG with scenario metadata."""

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.chat.ollama import get_embedding
from app.config import settings

_client: chromadb.ClientAPI | None = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(
            path=settings.chroma_path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name="products",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def index_products(products: list[dict]) -> int:
    collection = get_collection()
    if not products:
        return 0

    ids, documents, metadatas, embeddings = [], [], [], []
    for p in products:
        tags = ", ".join(p.get("scenarioTags") or [])
        doc = (
            f"{p['name']}. {p.get('description', '')}. "
            f"Category: {p['category']}. Step: {p.get('outfitStep', '')}. "
            f"Tags: {tags}. Gender: {p.get('genderTarget', 'unisex')}. "
            f"Colors: {', '.join(p.get('colors', []))}. Price: ${p.get('displayPrice', 0)}"
        )
        ids.append(p["id"])
        documents.append(doc)
        metadatas.append({
            "name": p["name"],
            "category": p["category"],
            "outfitStep": p.get("outfitStep") or "",
            "scenarioTags": tags,
            "genderTarget": p.get("genderTarget") or "unisex",
            "displayPrice": str(p.get("displayPrice", 0)),
            "image": (p.get("tryOnImageUrl") or (p.get("images") or [""])[0]) or "",
        })
        emb = await get_embedding(doc)
        embeddings.append(emb if emb else [0.0] * 768)

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
    return len(ids)


async def recommend_products(
    query: str,
    outfit_step: str | None = None,
    occasion: str | None = None,
    n_results: int = 6,
) -> list[dict]:
    collection = get_collection()
    search = query
    if occasion:
        search += f" {occasion}"
    if outfit_step:
        search += f" {outfit_step.lower()}"

    emb = await get_embedding(search)
    if not emb:
        return []

    where = None
    if outfit_step:
        where = {"outfitStep": outfit_step}

    kwargs: dict = {"query_embeddings": [emb], "n_results": n_results}
    if where:
        kwargs["where"] = where

    try:
        results = collection.query(**kwargs)
    except Exception:
        results = collection.query(query_embeddings=[emb], n_results=n_results)

    recs = []
    if results and results.get("ids") and results["ids"][0]:
        for i, pid in enumerate(results["ids"][0]):
            meta = results["metadatas"][0][i] if results.get("metadatas") else {}
            dist = results["distances"][0][i] if results.get("distances") else 0
            recs.append({
                "id": pid,
                "name": meta.get("name", ""),
                "displayPrice": float(meta.get("displayPrice", 0)),
                "image": meta.get("image", ""),
                "reason": f"Matches your style ({1 - dist:.0%} fit)" if dist else "Recommended for you",
                "outfitStep": meta.get("outfitStep"),
            })
    return recs
