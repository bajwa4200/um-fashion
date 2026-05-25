# UM Fashion Marketplace

Multi-vendor fashion marketplace with **Make Your Outfit** (3D + AI on GPU laptop).

---

## For your client (share this)

| Document | Purpose |
|----------|---------|
| **[docs/CLIENT-SHARE-LINK.md](docs/CLIENT-SHARE-LINK.md)** | Copy-paste message with demo URL and login accounts |
| **[apps/web live site]/gpu-setup** | In-browser guide for GPU laptop (after deploy) |

**Client demo on Vercel = marketplace only** (shops, products, cart, login). No GPU required.

---

## For you (deploy the client link)

Follow **[docs/DEPLOY-VERCEL-CLIENT-DEMO.md](docs/DEPLOY-VERCEL-CLIENT-DEMO.md)** step by step.

Summary:

1. Vercel project, root directory **`apps/web`**
2. Neon Postgres + env vars (`NEXT_PUBLIC_DEMO_MODE=true`, no `GPU_WORKER_URL`)
3. Deploy → seed DB → send client the URL from **CLIENT-SHARE-LINK.md**

Health check after deploy: `https://your-app.vercel.app/api/health`

---

## For your client’s GPU laptop (3D stylist — later)

Non-technical guide (print or PDF):

**[services/gpu-laptop/CLIENT-SETUP-GUIDE.md](services/gpu-laptop/CLIENT-SETUP-GUIDE.md)**

Start file: **[services/gpu-laptop/START-HERE.txt](services/gpu-laptop/START-HERE.txt)**

Zip and send the whole `services/gpu-laptop` folder. Client runs `setup.ps1` once, then `run.ps1` daily.

Developer reference (technical): [services/gpu-laptop/README-LAPTOP.md](services/gpu-laptop/README-LAPTOP.md)

---

## Local development (your machine)

```powershell
docker compose up -d
npm install
copy .env.example apps\web\.env.local
npm run db:seed:full
npm run dev --workspace=web
```

**Full AI locally** (optional):

```powershell
cd services\gpu-laptop
.\setup.ps1
.\run.ps1
```

In `apps\web\.env.local`:

```env
GPU_WORKER_URL=http://127.0.0.1:8100
GPU_WORKER_SECRET=change-me-gpu-secret
NEXT_PUBLIC_DEMO_MODE=false
```

Or CPU-only fallback: `cd services\ai && python run.py` with `AI_SERVICE_URL=http://localhost:8000`

---

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| User | user@um.fashion | user123 |
| Vendor | vendor@um.fashion | vendor123 |
| Admin | admin@um.fashion | superadmin123 |

---

## Architecture

| Where | What runs |
|-------|-----------|
| **Vercel** | Next.js, Neon DB, demo mode marketplace |
| **GPU laptop** | Ollama, 3D avatar, try-on, RAG (`services/gpu-laptop`) |
| **Docker (local)** | Postgres, MinIO, Redis, Ollama (dev only) |
