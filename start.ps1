Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting MindMap AI - Full Stack Development Server" -ForegroundColor Cyan
Write-Host "Multimodal AI Hackathon 2026 - Track D" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\venv\Scripts\python.exe backend\run.py"

Write-Host "[2/2] Launching Vite React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm.cmd run dev"

Write-Host "Done! Open your browser at http://localhost:5173" -ForegroundColor Yellow
