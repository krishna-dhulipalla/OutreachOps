@echo off
cd /d "%~dp0"
echo ==========================================
echo       Starting OutreachOps...
echo ==========================================

:: Activate virtual environment if it exists
if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment not found in backend\venv.
    echo Assuming Python is installed globally.
)

:: Start the app minimized
start "OutreachOps" /min cmd /c python run.py --all

:: Pause to keep window open if it crashes
pause
