@echo off
echo ========================================================
echo Starting MindMap AI - Full Stack Development Server
echo Multimodal AI Hackathon 2026 - Track D
echo ========================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8001 ...
start "MindMap AI Backend" cmd /k ".\venv\Scripts\python.exe backend\run.py"

echo [2/2] Launching Vite React Frontend on http://localhost:5173 ...
start "MindMap AI Frontend" cmd /k "cd frontend && npm.cmd run dev"

echo Both servers launched! Open your browser at http://localhost:5173
pause
