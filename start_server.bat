@echo off
echo ===================================================
echo   TrendYummy Server Automation
echo ===================================================

echo [1/3] Stopping existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       - Stopped successfully.
) else (
    echo       - No running processes found.
)

echo [2/3] Starting Development Server...
echo       - Server will launch in a new window.
start "TrendYummy Server" cmd /k "npm run dev"

echo [3/3] Waiting for server to initialize (5s)...
timeout /t 5 >nul

echo       - Opening Browser (http://localhost:3000)...
start http://localhost:3000

echo ===================================================
echo   Done! 
echo ===================================================
pause
