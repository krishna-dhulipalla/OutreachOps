@echo off
cd /d "%~dp0"

set "ROOT=%cd%"
if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"

set "PY=%ROOT%\backend\venv\Scripts\python.exe"
if not exist "%PY%" set "PY=python"

echo [%date% %time%] Starting OutreachOps...>> "%ROOT%\logs\outreachops.log"

"%PY%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 1 >> "%ROOT%\logs\outreachops.log" 2>&1
echo [%date% %time%] OutreachOps stopped.>> "%ROOT%\logs\outreachops.log"