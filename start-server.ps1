# Start Next.js Development Server
Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "Server will run on http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "To open in Cursor's Simple Browser:" -ForegroundColor Cyan
Write-Host "1. Press Ctrl+Shift+P" -ForegroundColor White
Write-Host "2. Type 'Simple Browser'" -ForegroundColor White
Write-Host "3. Enter: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Try to refresh PATH and run npm
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Change to the script directory
Set-Location $PSScriptRoot

# Try to find npm in common locations
$npmPath = $null
$searchPaths = @(
    "C:\Program Files\nodejs\npm.cmd",
    "C:\Program Files (x86)\nodejs\npm.cmd",
    "$env:APPDATA\npm\npm.cmd",
    "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd",
    "$env:ProgramFiles\nodejs\npm.cmd"
)

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        $npmPath = $path
        Write-Host "Found npm at: $path" -ForegroundColor Green
        break
    }
}

# Try to run npm
if ($npmPath) {
    try {
        & $npmPath run dev
    } catch {
        Write-Host "Error running npm: $_" -ForegroundColor Red
        pause
    }
} else {
    # Try with refreshed PATH
    try {
        $npmCmd = Get-Command npm -ErrorAction Stop
        Write-Host "Found npm via PATH: $($npmCmd.Source)" -ForegroundColor Green
        npm run dev
    } catch {
        Write-Host "Error: npm not found" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please do one of the following:" -ForegroundColor Yellow
        Write-Host "1. Install Node.js from https://nodejs.org" -ForegroundColor White
        Write-Host "2. Use Cursor's integrated terminal (Ctrl+`) and run: npm run dev" -ForegroundColor White
        Write-Host "3. Make sure Node.js is added to your system PATH" -ForegroundColor White
        Write-Host ""
        pause
    }
}

