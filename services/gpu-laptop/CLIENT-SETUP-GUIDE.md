# UM Fashion — 3D outfit stylist on your laptop

**For:** Windows laptop with **NVIDIA RTX 4060**  
**You do not need to know programming.** Follow each step in order.

---

## What this does

When setup is complete and your developer connects the website, you can:

- Upload a full-body photo and see a **3D digital twin**
- Use the **AI fashion stylist** (Roman Urdu / English)
- **Try clothes** from the marketplace on your twin

The public website demo works **without** this folder. This folder is only for the 3D / AI part.

---

## What you need before starting

| Item | Details |
|------|---------|
| Computer | Windows 10 or 11 |
| Graphics | NVIDIA **RTX 4060** (8 GB) |
| Disk space | About **30 GB** free |
| Internet | Required for downloads |
| Admin rights | To install programs |
| Time | About **45–60 minutes** first time |

---

## Step 1 — Update NVIDIA graphics drivers

1. Open your web browser.
2. Go to: **https://www.nvidia.com/download/index.aspx**
3. Choose your laptop model (or use **GeForce Experience** app if already installed).
4. Download and run the installer.
5. **Restart your computer** when asked.

**Check:** Right-click desktop → if you see **NVIDIA Control Panel**, drivers are installed.

---

## Step 2 — Install Python

1. Go to: **https://www.python.org/downloads/**
2. Click the big yellow **Download Python 3.12** button.
3. Run the downloaded file.
4. On the first screen, **tick the box:** `Add python.exe to PATH` (very important).
5. Click **Install Now** → Finish.

**Check:**

1. Press Windows key, type `cmd`, press Enter (black window opens).
2. Type: `python --version` and press Enter.
3. You should see something like `Python 3.12.x`.  
   If you see an error, uninstall Python and install again with **Add to PATH** ticked.

---

## Step 3 — Install Ollama (AI assistant)

1. Go to: **https://ollama.com/download**
2. Download **Windows** version.
3. Install like any normal app.
4. Open **Ollama** from the Start menu — leave it running (icon in system tray).

**Check:** Ollama window or tray icon shows the app is running.

---

## Step 4 — Copy this folder to your PC

Your developer gave you a folder named **`gpu-laptop`**.

1. Copy the whole folder to: **`C:\UM-GPU`**  
   (You can use another place, but remember the path.)
2. Inside you should see:
   - `setup.ps1`
   - `run.ps1`
   - `CLIENT-SETUP-GUIDE.md` (this file)
   - `START-HERE.txt`

---

## Step 5 — One-time setup (automatic)

1. Open **`C:\UM-GPU`** in File Explorer.
2. Find **`setup.ps1`**
3. **Right-click** → **Run with PowerShell**
4. If Windows shows “Windows protected your PC”:
   - Click **More info**
   - Click **Run anyway**
5. Wait until the window says setup is **complete** (5–20 minutes).
6. Read any message at the end, then press a key to close.

**If the window closes in 1 second:** Python is not on PATH — repeat Step 2.

---

## Step 6 — Download AI “brains” in Ollama

Open the **Ollama** app.

Download these two models (search in Ollama, click Download):

1. **`llama3.1:8b`** (about 4.7 GB — fashion chat)
2. **`nomic-embed-text`** (smaller — product search)

**Alternative (black window):**  
Open cmd and paste these one at a time (press Enter after each):

```
ollama pull llama3.1:8b
```

```
ollama pull nomic-embed-text
```

Wait until each download finishes.

---

## Step 7 — Every day you use 3D stylist

1. Make sure **Ollama** is running (tray icon).
2. Go to **`C:\UM-GPU`**
3. **Double-click `run.ps1`** (or right-click → Run with PowerShell)
4. **Leave the black window open** while you use Make Your Outfit on the website.
5. When finished, you can close the window.

---

## Step 8 — Connect to the live website (developer only)

**Only when your developer asks:**

They will send you:

- A **secret code** (GPU_WORKER_SECRET)
- Instructions to install **Cloudflare Tunnel** or similar

Typical steps (developer will guide you):

1. Install Cloudflare Tunnel from the link they send.
2. Run the tunnel command they give you.
3. Copy the **https://....** link that appears.
4. Send that link to your developer — they paste it into Vercel.

You do not need to understand the link. Keep the tunnel and `run.ps1` window **open** while testing 3D on the site.

---

## Troubleshooting (plain language)

| Problem | What to do |
|---------|------------|
| Black window closes instantly | Reinstall Python with **Add to PATH** checked |
| “python is not recognized” | Same as above |
| “Ollama not reachable” | Open Ollama app; wait 1 minute; try again |
| “CUDA not available” | Update NVIDIA drivers (Step 1); restart PC |
| Website still shows “GPU laptop” message | Tunnel not running, or developer has not updated Vercel yet |
| Setup very slow | Normal first time — needs internet for downloads |

**Always helpful:** Take a **screenshot** of the full black window with red error text and send to your developer.

---

## Who to contact

- **Website / login / cart issues:** Your developer (Vercel demo link)
- **This laptop setup:** Your developer — send screenshots from setup or run window

---

## Quick checklist

- [ ] NVIDIA drivers updated, PC restarted  
- [ ] Python installed with Add to PATH  
- [ ] Ollama installed and open  
- [ ] Folder at C:\UM-GPU  
- [ ] setup.ps1 finished successfully  
- [ ] llama3.1:8b and nomic-embed-text downloaded in Ollama  
- [ ] run.ps1 starts without instant crash  
- [ ] Developer connected tunnel (when ready)

**You are done with one-time setup when all boxes are checked.**
