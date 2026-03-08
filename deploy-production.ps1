# Full production deploy - Coco Hawaii Website 2026
# Run from project root: .\deploy-production.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n=== COCO HAWAII - FULL PRODUCTION DEPLOY ===" -ForegroundColor Cyan
Write-Host ""

# 1. Build
Write-Host "1. Building Next.js (production)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed." }
Write-Host "   Build OK.`n" -ForegroundColor Green

# 2. Deploy via Vercel
Write-Host "2. Deploying to Vercel (production)..." -ForegroundColor Yellow
npx vercel --prod --yes
if ($LASTEXITCODE -ne 0) { throw "Vercel deploy failed." }
Write-Host "   Deploy OK.`n" -ForegroundColor Green

Write-Host "=== DEPLOY COMPLETE ===" -ForegroundColor Green
Write-Host "Site is live. Check your Vercel project URL or cocohawaii.world`n"
