"""ChromaDB RAG for product recommendations."""

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings
from app.ollama_client import get_embedding

_chroma_client: chromadb.ClientAPI | None = None
_collection = None


def get_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        _collection = _chroma_client.get_or_create_collection(
            name="products",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def index_products(products: list[dict]) -> int:
    collection = get_collection()
    if not products:
        return 0

    ids = []
    documents = []
    metadatas = []

    for p in products:
        doc = (
            f"{p['name']}. {p.get('description', '')}. "
            f"Category: {p['category']}. "
            f"Step: {p.get('outfitStep', 'general')}. "
            f"Colors: {', '.join(p.get('colors', []))}. "
            f"Price: ${p.get('displayPrice', 0)}"
        )
        ids.append(p["id"])
        documents.append(doc)
        metadatas.append({
            "name": p["name"],
            "category": p["category"],
            "outfitStep": p.get("outfitStep") or "",
            "displayPrice": str(p.get("displayPrice", 0)),
            "image": p.get("images", [""])[0] if p.get("images") else "",
        })

    embeddings = []
    for doc in documents:
        emb = await get_embedding(doc)
        embeddings.append(emb if emb else [0.0] * 768)

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings,
    )
    return len(ids)


async def recommend_products(
    query: str,
    outfit_step: str | None = None,
    occasion: str | None = None,
    n_results: int = 6,
) -> list[dict]:
    collection = get_collection()

    search_query = query
    if occasion:
        search_query += f" for {occasion}"
    if outfit_step:
        search_query += f" {outfit_step.lower()}"

    embedding = await get_embedding(search_query)
    if not embedding:
        return _fallback_search(collection, outfit_step, n_results)

    where_filter = None
    if outfit_step:
        where_filter = {"outfitStep": outfit_step}

    try:
        results = collection.query(
            query_embeddings=[embedding],
            n_results=n_results * 2,
            where=where_filter,
        )
    except Exception:
        results = collection.query(
            query_embeddings=[embedding],
            n_results=n_results * 2,
        )

    recommendations = []
    if results and results["ids"] and results["ids"][0]:
        for i, pid in enumerate(results["ids"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            doc = results["documents"][0][i] if results["documents"] else ""
            recommendations.append({
                "id": pid,
                "name": meta.get("name", ""),
                "displayPrice": float(meta.get("displayPrice", 0)),
                "image": meta.get("image", ""),
                "reason": doc[:120] + "..." if len(doc) > 120 else doc,
                "category": meta.get("category", ""),
                "outfitStep": meta.get("outfitStep", ""),
            })

    if not recommendations and outfit_step:
        return _fallback_search(collection, outfit_step, n_results)

    return recommendations[:n_results]


def _fallback_search(collection, outfit_step: str | None, n_results: int) -> list[dict]:
    try:
        count = collection.count()
        if count == 0:
            return []
        results = collection.get(limit=n_results)
        recs = []
        for i, pid in enumerate(results["ids"]):
            meta = results["metadatas"][i] if results["metadatas"] else {}
            if outfit_step and meta.get("outfitStep") != outfit_step:
                continue
            recs.append({
                "id": pid,
                "name": meta.get("name", ""),
                "displayPrice": float(meta.get("displayPrice", 0)),
                "image": meta.get("image", ""),
                "reason": "Recommended for your style",
                "category": meta.get("category", ""),
                "outfitStep": meta.get("outfitStep", ""),
            })
        return recs[:n_results]
    except Exception:
        return []
