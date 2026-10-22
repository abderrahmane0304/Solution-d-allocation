@echo off
chcp 65001 > nul
title SAIOT - Système d'Allocation Intelligente (Textile & Gemini AI)
color 0B

echo ===============================================================================
echo        SAIOT · Système d'Aide à l'Allocation des Opérateurs Textiles
echo              Optimisation Industrielle & Agent AI (Google Gemini)
echo ===============================================================================
echo.

:: 1. Vérification de Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas détecté sur votre système.
    echo Veuillez installer Node.js depuis https://nodejs.org/ pour lancer la solution.
    echo.
    pause
    exit /b 1
)

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: 2. Vérification et installation des dépendances Backend
echo [1/4] Vérification du Backend API...
if not exist "%BACKEND_DIR%\node_modules" (
    echo [INFO] Installation des dépendances Backend (Express + SQLite)...
    cd /d "%BACKEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] L'installation du backend a échoué.
        pause
        exit /b 1
    )
    echo [OK] Backend prêt.
    echo.
)

:: 3. Vérification et installation des dépendances Frontend
echo [2/4] Vérification du Frontend React...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Installation des dépendances Frontend (React + Vite)...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] L'installation du frontend a échoué.
        pause
        exit /b 1
    )
    echo [OK] Frontend prêt.
    echo.
)

:: 4. Vérification du fichier .env
if not exist "%FRONTEND_DIR%\.env" (
    echo [ATTENTION] Le fichier .env est absent dans frontend.
    echo Création d'un fichier .env par défaut...
    (
        echo # Clé API Google Gemini
        echo # Obtenez votre clé gratuite sur : https://aistudio.google.com/apikey
        echo VITE_GEMINI_API_KEY=VOTRE_CLE_API_ICI
    ) > "%FRONTEND_DIR%\.env"
    echo [INFO] Fichier .env créé.
    echo.
)

:: 5. Démarrage du serveur Backend API (Port 3000)
echo [3/4] Démarrage du serveur Backend API sur http://localhost:3000...
start "SAIOT - Backend API (Port 3000)" cmd /k "title SAIOT Backend API && color 0A && cd /d "%BACKEND_DIR%" && node src/server.js"

:: 6. Ouverture automatique du navigateur
echo [4/4] Lancement de l'interface et ouverture du navigateur...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173/"

echo.
echo ===============================================================================
echo      ✅ Solution SAIOT lancée avec succès !
echo      - Backend API + Base SQLite : http://localhost:3000/
echo      - Frontend React            : http://localhost:5173/
echo.
echo      Pour arrêter l'application, fermez les fenêtres du terminal.
echo ===============================================================================
echo.

:: 7. Démarrage du serveur Frontend (Port 5173)
cd /d "%FRONTEND_DIR%"
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le serveur frontend s'est arrêté avec une erreur.
    pause
)
