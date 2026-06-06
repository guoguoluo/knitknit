@echo off
cd /d "F:\BrainChild"
start "Next.js Dev" cmd /c "npm run dev"
echo Waiting for Next.js...
:waitloop
timeout /t 3 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 goto waitloop
echo Next.js ready, launching Electron...
npx electron .