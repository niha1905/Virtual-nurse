# Test Backend API Endpoints
# Run this after starting backend_template.py

Write-Host "🧪 Testing Virtual Nurse AI Backend API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:5000"

# Test 1: Vitals Endpoint
Write-Host "✅ Test 1: GET /api/vitals" -ForegroundColor Green
try {
    $vitals = Invoke-RestMethod -Uri "$baseUrl/api/vitals" -Method GET
    Write-Host "   Response:" -ForegroundColor Yellow
    $vitals | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Voice Endpoint
Write-Host "✅ Test 2: POST /api/voice" -ForegroundColor Green
try {
    $body = @{text = "What is my heart rate?"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/voice" -Method POST -Body $body -ContentType "application/json"
    Write-Host "   Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Alerts Endpoint
Write-Host "✅ Test 3: GET /api/alerts" -ForegroundColor Green
try {
    $alerts = Invoke-RestMethod -Uri "$baseUrl/api/alerts" -Method GET
    Write-Host "   Response:" -ForegroundColor Yellow
    $alerts | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Reminders Endpoint
Write-Host "✅ Test 4: GET /api/reminders" -ForegroundColor Green
try {
    $reminders = Invoke-RestMethod -Uri "$baseUrl/api/reminders" -Method GET
    Write-Host "   Response:" -ForegroundColor Yellow
    $reminders | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 5: Auth Session Endpoint
Write-Host "✅ Test 5: GET /api/auth/session" -ForegroundColor Green
try {
    $session = Invoke-RestMethod -Uri "$baseUrl/api/auth/session" -Method GET
    Write-Host "   Response:" -ForegroundColor Yellow
    $session | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 6: Login Endpoint
Write-Host "✅ Test 6: POST /api/auth/login" -ForegroundColor Green
try {
    $loginBody = @{
        email = "demo@virtualnurse.ai"
        password = "demo123"
        role = "patient"
    } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "   Response:" -ForegroundColor Yellow
    $login | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open index.html in your browser" -ForegroundColor White
Write-Host "2. Try the voice assistant" -ForegroundColor White
Write-Host "3. Open patient.html to see the dashboard" -ForegroundColor White
