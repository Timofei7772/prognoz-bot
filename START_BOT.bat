@echo off
title PROGNOZ BOT - LAUNCHER
color 0A
echo ========================================================
echo             ZAPUSK PROGNOZ BOT (BETGURU)
echo ========================================================
echo.
echo 1. Stopping previous processes...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo 2. Starting Server and Interface...
echo.
echo Please wait... Validating Live Connections...
echo.
cd /d "%~dp0"
npm run dev
pause
