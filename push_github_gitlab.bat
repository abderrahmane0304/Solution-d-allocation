@echo off
chcp 65001 > nul
title SAIOT - Publication Automatisée vers GitHub et GitLab
color 0B

echo ===============================================================================
echo        SAIOT · Système d'Aide à l'Allocation des Opérateurs Textiles
echo              Publication Automatisée vers GitHub et GitLab
echo ===============================================================================
echo.
echo Ce script va lier ce projet local à vos dépôts GitHub et GitLab et
echo effectuer le premier push de votre code avec le README complet.
echo.

:: Vérification de Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERREUR] Git n'est pas détecté dans votre variable PATH.
    echo Veuillez installer Git depuis https://git-scm.com/
    pause
    exit /b 1
)

:: 1. Configuration de l'identité de l'auteur Git
echo -------------------------------------------------------------------------------
echo  1. IDENTITÉ DE L'AUTEUR (Optionnel pour lier les commits à vos comptes)
echo -------------------------------------------------------------------------------
set /p GIT_NAME="Entrez votre nom/pseudo (Entrée pour conserver le profil par défaut) : "
if not "%GIT_NAME%"=="" (
    git config user.name "%GIT_NAME%"
)

set /p GIT_EMAIL="Entrez votre adresse email (Entrée pour conserver le profil par défaut) : "
if not "%GIT_EMAIL%"=="" (
    git config user.email "%GIT_EMAIL%"
)

if not "%GIT_NAME%"=="" (
    echo [OK] Mise à jour de l'auteur du commit...
    git commit --amend --reset-author --no-edit >nul 2>nul
)

echo.
echo -------------------------------------------------------------------------------
echo  2. LIENS DES DÉPÔTS DISTANTS (REMOTES)
echo -------------------------------------------------------------------------------
echo Note : Si vous n'avez pas encore créé le dépôt, créez-le vide (sans README ni
echo licence initiale) sur https://github.com/new et https://gitlab.com/projects/new
echo.

set /p GITHUB_URL="Collez l'URL de votre dépôt GitHub (ou appuyez sur Entrée pour passer) : "
set /p GITLAB_URL="Collez l'URL de votre dépôt GitLab (ou appuyez sur Entrée pour passer) : "

if "%GITHUB_URL%"=="" if "%GITLAB_URL%"=="" (
    color 0E
    echo.
    echo [ATTENTION] Aucune URL n'a été saisie. Le push ne peut pas être effectué.
    echo Vous pourrez relancer ce script à tout moment dès que vos dépôts seront créés.
    echo.
    pause
    exit /b 0
)

echo.
echo -------------------------------------------------------------------------------
echo  3. VÉRIFICATION DU DÉPÔT ET DES FICHIERS
echo -------------------------------------------------------------------------------
git add .
git commit -m "feat: solution complete SAIOT Textile avec IA Gemini, multi-shifts et base SQLite" >nul 2>nul
git branch -M main

:: Push vers GitHub
if not "%GITHUB_URL%"=="" (
    echo.
    echo [GitHub] Configuration du remote GitHub...
    git remote remove origin >nul 2>nul
    git remote remove github >nul 2>nul
    git remote add origin "%GITHUB_URL%"
    
    echo [GitHub] Envoi du code (push) vers GitHub...
    echo (Si demandé, autorisez la connexion dans la fenêtre qui s'ouvre)
    git push -u origin main
    if %errorlevel% equ 0 (
        echo [SUCCÈS] Code publié avec succès sur GitHub !
    ) else (
        echo [AVERTISSEMENT] Le push vers GitHub a échoué. Vérifiez vos droits d'accès ou l'URL.
    )
)

:: Push vers GitLab
if not "%GITLAB_URL%"=="" (
    echo.
    echo [GitLab] Configuration du remote GitLab...
    git remote remove gitlab >nul 2>nul
    git remote add gitlab "%GITLAB_URL%"
    
    echo [GitLab] Envoi du code (push) vers GitLab...
    echo (Si demandé, autorisez la connexion dans la fenêtre qui s'ouvre)
    git push -u gitlab main
    if %errorlevel% equ 0 (
        echo [SUCCÈS] Code publié avec succès sur GitLab !
    ) else (
        echo [AVERTISSEMENT] Le push vers GitLab a échoué. Vérifiez vos droits d'accès ou l'URL.
    )
)

:: Configuration du multi-push (optionnel : push vers les deux en une seule commande)
if not "%GITHUB_URL%"=="" if not "%GITLAB_URL%"=="" (
    echo.
    echo Configuration du multi-push simultané (commande : git push origin main)...
    git remote set-url --add --push origin "%GITHUB_URL%" >nul 2>nul
    git remote set-url --add --push origin "%GITLAB_URL%" >nul 2>nul
    echo [OK] Dès maintenant, taper 'git push origin main' mettra à jour GitHub ET GitLab !
)

echo.
echo ===============================================================================
echo                          🎉 OPÉRATION TERMINÉE !
echo ===============================================================================
echo.
pause
