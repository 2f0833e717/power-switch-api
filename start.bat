@echo off
chcp 65001 >nul
title SwitchBot 電源制御アプリ
echo.
echo ========================================
echo   SwitchBot 電源制御アプリを起動中...
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo 依存関係をインストールしています...
    call npm install
    echo.
)

if not exist ".env" (
    echo [警告] .envファイルが見つかりません。
    echo SETUP.mdを参照して認証情報を設定してください。
    echo.
    pause
    exit /b 1
)

echo 既存のサーバープロセスを確認しています...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo サーバーを起動しています...
echo ブラウザで http://localhost:3000 にアクセスしてください。
echo.
echo 停止するには、このウィンドウを閉じるか Ctrl+C を押してください。
echo.

node server.js

if errorlevel 1 (
    echo.
    echo エラーが発生しました。
    pause
)
