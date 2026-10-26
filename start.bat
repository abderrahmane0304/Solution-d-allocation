@echo off
setlocal
chcp 65001 >nul
title SAIOT - Systeme d'Allocation Intelligente Textile
color 0B

echo ===============================================================================
echo        SAIOT - Systeme d'Aide a l'Allocation des Operateurs Textiles
echo              Optimisation Industrielle et Agent AI Google Gemini
echo ===============================================================================
echo.

:: 1. Verification de Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas detecte sur votre systeme.
    echo Veuillez installer Node.js depuis https://nodejs.org/ pour lancer la solution.
    echo.
    pause
    exit /b 1
)

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: 2. Nettoyage preventif des ports 3000 et 5173
echo [1/4] Preparation de l'environnement...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul

:: 3. Verification des dependances Backend
echo [2/4] Verification du Backend API...
if not exist "%BACKEND_DIR%\node_modules" (
    echo [INFO] Installation des dependances Backend Express et SQLite...
    cd /d "%BACKEND_DIR%"
    call npm install
    if errorlevel 1 (
        echo [ERREUR] L'installation du backend a echoue.
        pause
        exit /b 1
    )
    echo [OK] Backend pret.
    echo.
) else (
    echo [OK] Dependances Backend pretes.
)

:: 4. Verification des dependances Frontend
echo [3/4] Verification du Frontend React...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Installation des dependances Frontend React et Vite...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        echo [ERREUR] L'installation du frontend a echoue.
        pause
        exit /b 1
    )
    echo [OK] Frontend pret.
    echo.
) else (
    echo [OK] Dependances Frontend pretes.
)

:: 5. Verification du fichier .env
if not exist "%FRONTEND_DIR%\.env" (
    echo [INFO] Creation du fichier .env par defaut...
    (
        echo # Cle API Google Gemini
        echo # Obtenez votre cle gratuite sur : https://aistudio.google.com/apikey
        echo VITE_GEMINI_API_KEY=VOTRE_CLE_API_ICI
    ) > "%FRONTEND_DIR%\.env"
    echo [OK] Fichier .env cree.
    echo.
)

:: 6. Demarrage du serveur Backend API (Port 3000)
echo [4/4] Demarrage des serveurs SAIOT...
start powershell -NoProfile -Command "Set-Location '%BACKEND_DIR%'; $host.ui.RawUI.WindowTitle = 'SAIOT Backend API (Port 3000)'; node src/server.js"

:: 7. Ouverture automatique du navigateur apres un court delai
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:5173/'"

echo.
echo ===============================================================================
echo      Solution SAIOT lancee avec succes !
echo      - Backend API et Base SQLite : http://localhost:3000/
echo      - Frontend React             : http://localhost:5173/
echo.
echo      Le frontend demarre ci-dessous. Ne fermez pas cette fenetre.
echo      Pour arreter l'application, fermez les fenetres ouvertes.
echo ===============================================================================
echo.

:: 8. Demarrage du serveur Frontend (Port 5173)
cd /d "%FRONTEND_DIR%"
call npm run dev

if errorlevel 1 (
    echo.
    echo [ERREUR] Le serveur frontend s'est arrete avec une erreur.
    pause
)
