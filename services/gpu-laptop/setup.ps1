# UM Fashion GPU Laptop — one-time setup (RTX 4060)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== UM GPU Laptop Setup ===" -ForegroundColor Cyan

if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    nvidia-smi
} else {
    Write-Warning "nvidia-smi not found. Install NVIDIA drivers for CUDA."
}

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "Created .env — edit GPU_WORKER_SECRET and Redis/Blob keys." -ForegroundColor Yellow
}

Write-Host "`nPull Ollama models (requires Ollama installed):" -ForegroundColor Cyan
Write-Host "  ollama pull llama3.1:8b"
Write-Host "  ollama pull nomic-embed-text"

Write-Host "`nHealth check:" -ForegroundColor Cyan
python -c "from app.main import app; print('Import OK')"

Write-Host "`n=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "Next: open CLIENT-SETUP-GUIDE.md — Step 6 (Ollama models)" -ForegroundColor Cyan
Write-Host "Daily use: double-click run.ps1" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to close this window"
