# UM Fashion — GPU Laptop (RTX 4060)

Run all AI on this machine: Ollama chat, 3D avatar, 3D try-on, product RAG.

## One-time setup

```powershell
cd D:\Programs\um\services\gpu-laptop
.\setup.ps1
```

Install [Ollama](https://ollama.com) then:

```powershell
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

Edit `.env` — set `GPU_WORKER_SECRET`, `UPSTASH_REDIS_*`, `BLOB_READ_WRITE_TOKEN` (same values as Vercel).

## Daily start

```powershell
.\run.ps1
```

## Connect to Vercel

1. Expose port 8100:

```powershell
cloudflared tunnel --url http://127.0.0.1:8100
```

2. Copy the `https://....trycloudflare.com` URL into Vercel env `GPU_WORKER_URL`.
3. Use the same `GPU_WORKER_SECRET` on Vercel and laptop `.env`.

## Optional: TripoSR (higher mesh quality)

Place TripoSR weights under `models/triposr/` and set `HUMAN_MESH_MODE=triposr`.

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | CUDA, Ollama, Redis status |
| `POST /avatar/generate3d` | Full 3D twin + thumbnailBase64 |
| `POST /tryon/3d` | Garment on twin |
| `POST /chat` / `/chat/stream` | Fashion stylist |
| `POST /recommend` | RAG products |
| `POST /jobs/enqueue` | Async jobs when Vercel queues |

## Verification

1. `curl http://127.0.0.1:8100/health`
2. Upload full-body A-pose photo in Make Your Outfit → 3D tab rotates
3. Pick shirt → preview updates
