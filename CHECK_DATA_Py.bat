@echo off
title PYTHON DATA CHECK
color 0E
echo ========================================================
echo             PYTHON INDEPENDENT VERIFICATION
echo ========================================================
echo.
echo Connecting to BBC Sport via Python...
echo.
cd /d "%~dp0"
python verify_data.py
echo.
echo.
echo If you see correct data above, Node.js Bot is also correct.
pause
