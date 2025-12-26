@echo off
cd /d "c:\Users\User\.gemini\antigravity\playground\final-tyson"
start /min cmd /c "npm run dev"
timeout /t 5
start http://localhost:5173
