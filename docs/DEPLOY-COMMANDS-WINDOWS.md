# Copy-paste commands — GitHub + Vercel deploy (Windows)

Run these in **PowerShell** from your PC. Replace `YOUR_GITHUB_USERNAME` and repo name as needed.

---

## 0. One-time installs (if missing)

```powershell
winget install Git.Git
winget install GitHub.cli
npm install -g vercel
```

Close and reopen PowerShell after installing.

Check:

```powershell
git --version
gh --version
vercel --version
node -v
```

---

## 1. Log in to GitHub

```powershell
gh auth login
```

Choose:

- **GitHub.com**
- **HTTPS**
- **Login with a web browser** (easiest) — copy code, press Enter, approve in browser

Verify:

```powershell
gh auth status
```

---

## 2. Log in to Vercel

```powershell
vercel login
```

Follow the browser link and approve.

Verify:

```powershell
vercel whoami
```

---

## 3. Push project to GitHub

```powershell
cd D:\Programs\um

git init
git add .
git status
git commit -m "UM Fashion marketplace — Vercel client demo"
```

Create repo on GitHub and push (pick **one** name, e.g. `um-fashion`):

```powershell
gh repo create um-fashion --private --source=. --remote=origin --push
```

If the repo already exists on GitHub empty:

```powershell
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/um-fashion.git
git branch -M main
git push -u origin main
```

---

## 4. Deploy on Vercel (from GitHub — recommended)

### Option A — Vercel website (easiest)

1. Open https://vercel.com/new
2. **Import** your `um-fashion` repo
3. **Root Directory:** click Edit → set to `apps/web`
4. **Environment Variables** — add before first deploy:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_DEMO_MODE` | `true` |
| `NEXTAUTH_SECRET` | *(run command below, paste result)* |
| `NEXTAUTH_URL` | `https://TEMP.vercel.app` *(fix after deploy — step 6)* |

Generate secret:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

5. Click **Deploy**
6. After deploy: **Settings → Environment Variables** → set `NEXTAUTH_URL` to your real URL, e.g. `https://um-fashion-xxx.vercel.app` → **Redeploy**

### Option B — Vercel CLI from folder

```powershell
cd D:\Programs\um\apps\web
vercel link
```

Answer: link to your account, create new project, root is current folder (`apps/web`).

```powershell
vercel env add NEXT_PUBLIC_DEMO_MODE production
```
When prompted, type: `true`

```powershell
vercel env add NEXTAUTH_SECRET production
```
Paste the secret from the PowerShell command above.

```powershell
vercel env add NEXTAUTH_URL production
```
Use your Vercel URL after first deploy, or run `vercel` once to get preview URL first.

```powershell
cd D:\Programs\um
vercel --prod
```

---

## 5. Add Neon database (Postgres)

**In Vercel dashboard** (not terminal):

1. Open your project → **Storage** tab
2. **Create Database** → **Neon** → Continue
3. Region close to you → Create
4. Connect to project — Vercel adds `DATABASE_URL` automatically
5. **Redeploy** (Deployments → … → Redeploy)

Copy connection string for seeding (Neon dashboard or Vercel → Storage → `.env.local` tab):

```powershell
$env:DATABASE_URL="postgresql://USER:PASS@HOST/neondb?sslmode=require"
cd D:\Programs\um
npm install
npm run db:push
npm run db:seed
```

---

## 6. Fix NEXTAUTH_URL (important)

After you know your live URL:

**Dashboard:** Settings → Environment Variables → `NEXTAUTH_URL` = `https://your-app.vercel.app` → Save → Redeploy

**Or CLI:**

```powershell
cd D:\Programs\um\apps\web
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
vercel --prod
```

---

## 7. Verify

```powershell
# Replace with your URL
curl https://YOUR-APP.vercel.app/api/health
```

Browser:

- Home page loads with products
- Login: `user@um.fashion` / `user123`
- Make Your Outfit → GPU laptop message (not error 500)

---

## 8. Share with client

Edit `docs/CLIENT-SHARE-LINK.md` — replace `YOUR_VERCEL_URL` with your link — send to client.

---

## Do NOT set on Vercel (demo mode)

- `GPU_WORKER_URL`
- `AI_SERVICE_URL`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Vercel | Root Directory must be `apps/web` |
| Home page 500 | Seed DB (step 5); check `DATABASE_URL` |
| Login fails | `NEXTAUTH_URL` must match exact Vercel URL + redeploy |
| `gh` not found | Install GitHub CLI, reopen terminal |
| Push rejected | `git pull origin main --rebase` then push again |
