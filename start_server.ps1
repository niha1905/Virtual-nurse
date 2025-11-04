# 🚀 Virtual Nurse AI - Quick Start Script
# Run this to start the backend server

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🏥 Virtual Nurse AI - Starting Backend Server" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "🔍 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Flask is installed
Write-Host "`n🔍 Checking Flask installation..." -ForegroundColor Yellow
$flaskCheck = python -c "import flask; print(flask.__version__)" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Flask installed: $flaskCheck" -ForegroundColor Green
} else {
    Write-Host "⚠️  Flask not found. Installing..." -ForegroundColor Yellow
    pip install flask flask-cors
}

# Navigate to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "`n📦 Project Directory: $scriptPath" -ForegroundColor Cyan

# Check if models.py exists
if (Test-Path "models.py") {
    Write-Host "✅ AI Models module found" -ForegroundColor Green
} else {
    Write-Host "⚠️  models.py not found" -ForegroundColor Yellow
}

# Start the backend server
Write-Host "`n🚀 Starting Flask Backend Server..." -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 Server will run on: http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "🌐 Open your HTML files in browser to use the app" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Run the backend
python backend_template.py
