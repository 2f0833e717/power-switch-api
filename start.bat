@echo off
chcp 65001 >nul 2>&1
title SwitchBot Power Control App
echo.
echo ========================================
echo   SwitchBot Power Control App Starting...
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

if not exist ".env" (
    echo [Warning] .env file not found.
    echo Please set up authentication information. See docs\SETUP.md
    echo.
    pause
    exit /b 1
)

echo Checking for existing server processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting server...
echo Browser will open automatically at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.

node server.js

if errorlevel 1 (
    echo.
    echo An error occurred.
    pause
)
