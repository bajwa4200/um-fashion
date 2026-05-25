# Start GPU laptop API + worker
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv")) {
    Write-Host "Run .\setup.ps1 first" -ForegroundColor Red
    exit 1
}

& .\.venv\Scripts\Activate.ps1

Write-Host "=== UM GPU Laptop ===" -ForegroundColor Cyan
Write-Host "API: http://127.0.0.1:8100/health"
Write-Host ""
Write-Host "Expose to Vercel (pick one):" -ForegroundColor Yellow
Write-Host "  cloudflared tunnel --url http://127.0.0.1:8100"
Write-Host "  ngrok http 8100"
Write-Host ""
Write-Host "Set on Vercel: GPU_WORKER_URL=<tunnel-https-url>"
Write-Host "Set on Vercel + laptop .env: GPU_WORKER_SECRET=<same secret>"
Write-Host ""
Write-Host "Keep this window OPEN while using 3D stylist on the website." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

python run.py
