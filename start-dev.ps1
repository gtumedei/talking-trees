Write-Host "🌳 Starting Monumental Trees Development Environment..." -ForegroundColor Green

# Check dependencies
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "Python: $(python --version)"
Write-Host "Node.js: $(node --version)"
Write-Host ""

# Backend
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
Set-Location backend
python -m pip install --upgrade pip
pip install -r requirements.txt
python -c "import langchain_community; print('✅ langchain-community installed')"

# Frontend
Write-Host "`n📦 Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location ..
npm install

# Start servers
Write-Host "`n🚀 Starting servers..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python chatbot_api.py"

# Wait and start frontend
Start-Sleep 3
npm run dev