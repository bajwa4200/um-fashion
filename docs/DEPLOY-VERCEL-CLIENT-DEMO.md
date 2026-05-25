# Deploy UM Fashion — Client demo on Vercel

This deploys **marketplace only** (no GPU laptop). The client gets a clean URL to browse shops, products, cart, and login.

## Before you start

- GitHub repo with this code pushed
- [Vercel](https://vercel.com) account
- [Neon](https://neon.tech) Postgres (via Vercel Marketplace is easiest)

## 1. Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) → Import your Git repository.
2. **Root Directory:** `apps/web`
3. Framework: **Next.js** (auto-detected)
4. Build settings are read from `apps/web/vercel.json` — do not override unless build fails.

## 2. Add Neon database

1. In Vercel project → **Storage** or **Integrations** → **Neon**
2. Create database → connect to project
3. Vercel sets `DATABASE_URL` automatically

## 3. Environment variables

In Vercel → **Settings** → **Environment Variables**, add for **Production** and **Preview**:

| Name | Value |
|------|--------|
| `DATABASE_URL` | From Neon (auto if integrated) |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` (your real Vercel URL) |
| `NEXTAUTH_SECRET` | Random string — run `openssl rand -base64 32` or any password generator |
| `NEXT_PUBLIC_DEMO_MODE` | `true` |
| `STRIPE_SECRET_KEY` | Optional — Stripe test key |
| `STRIPE_PUBLISHABLE_KEY` | Optional — Stripe test publishable key |

**Do NOT set** (leave empty):

- `GPU_WORKER_URL`
- `AI_SERVICE_URL`
- `UPSTASH_REDIS_*` (not needed for marketplace-only demo)

## 4. Deploy

Click **Deploy** or push to `main` if Git integration is on.

Wait for build to finish. Note your URL: `https://xxxx.vercel.app`

## 5. Seed the database (once)

On your PC (with Node.js installed):

```powershell
cd D:\Programs\um
$env:DATABASE_URL="postgresql://...."   # copy from Neon dashboard → Connection string
npm run db:push
npm run db:seed
```

## 6. Smoke test

1. Open `https://YOUR-PROJECT.vercel.app`
2. `https://YOUR-PROJECT.vercel.app/api/health` → `"demoMode": true`, `"database": "connected"`
3. Home page shows products (no 500 error)
4. Login: `user@um.fashion` / `user123`
5. Click **Make Your Outfit** → see GPU laptop message (not broken upload)
6. Open `/gpu-setup` — guide loads

## 7. Share with client

Copy the template in [CLIENT-SHARE-LINK.md](./CLIENT-SHARE-LINK.md) and fill in your Vercel URL.

Send the client separately:

- Folder `services/gpu-laptop` (zip) with **CLIENT-SETUP-GUIDE.md** — only if they want 3D later

## Later: enable 3D on production

When client runs GPU laptop + tunnel:

1. Set `GPU_WORKER_URL` on Vercel to tunnel HTTPS URL
2. Set `GPU_WORKER_SECRET` (same on laptop `.env`)
3. Set `NEXT_PUBLIC_DEMO_MODE` to `false`
4. Redeploy
