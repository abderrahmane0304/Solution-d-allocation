# 🧵 SAIOT — Système d'Allocation Intelligente des Opérateurs Textiles
> **Optimisation Industrielle de Confection · Algorithme Smart Matching · Agent IA Google Gemini 2.5 · Multi-Shifts**

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey?logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)](https://sqlite.org/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-8E75B2?logo=google)](https://aistudio.google.com/)
[![ESITH](https://img.shields.io/badge/Projet-ESITH%20Textile-darkred)](https://www.esith.ac.ma/)

---

## 📌 Sommaire
1. [Présentation & Contexte Industriel](#-présentation--contexte-industriel)
2. [Architecture Technique & Schéma Global](#-architecture-technique)
3. [Fonctionnalités Majeures](#-fonctionnalités-majeures)
   - [Supervision en Temps Réel des Lignes](#1-supervision-en-temps-réel-des-lignes)
   - [Moteur Hybride : Algorithme SAIOT & Agent IA Gemini](#2-moteur-hybride--algorithme-saiot--agent-ia-gemini)
   - [Authentification Industrielle & 4 Rôles](#3-authentification-industrielle--4-rôles)
   - [Gestion Multi-Shifts & Quarts de Travail](#4-gestion-multi-shifts--quarts-de-travail)
   - [Matrice de Polyvalence & Certifications Machines](#5-matrice-de-polyvalence--certifications-machines)
   - [Rapports TRS (OEE) & Suivi de l'Absentéisme](#6-rapports-trs-oee--suivi-de-labsentéisme)
   - [Pondération Personnalisable de l'Algorithme](#7-pondération-personnalisable-de-lalgorithme)
4. [Identifiants de Connexion (Comptes Démo)](#-identifiants-de-connexion-comptes-démo)
5. [Démarrage Rapide (1-Clic Windows)](#-démarrage-rapide-windows)
6. [Installation & Déploiement Manuel](#-installation--déploiement-manuel)
7. [Configuration de l'Agent IA (Google Gemini)](#-configuration-de-lagent-ia-google-gemini)
8. [Schéma de la Base de Données Relationnelle](#-schéma-de-la-base-de-données)
9. [Documentation des Endpoints API REST](#-documentation-des-endpoints-api-rest)
10. [Instructions Git : GitHub & GitLab](#-instructions-git-publication-github--gitlab)

---

## 🏭 Présentation & Contexte Industriel

Dans l'industrie textile et de l'habillement, la confection de vêtements (pantalons chino, polos en maille piquée, t-shirts jersey) s'effectue sur des **lignes de production séquentielles hautement cadencées**. Chaque ligne comporte des postes clés : piqueuse plate, surjeteuse (3, 4 ou 5 fils), automate de pose de poche, ourlage, plaquage de patte et contrôle qualité final.

### La problématique
- **L'absentéisme imprévu** : Lorsqu'une opératrice ou un opérateur clé s'absente le matin, un poste reste vide.
- **Le goulot d'étranglement (Bottleneck)** : Si le poste vide est un poste critique (cadence élevée, machine automatisée complexe), toute la ligne en amont et en aval s'arrête en quelques minutes, entraînant des pertes de cadence massives.
- **La décision de remplacement** : Affecter un remplaçant au hasard peut créer des rebuts qualité, ralentir la cadence (temps de montée en régime ou *ramping*), ou déstabiliser une autre ligne tout aussi prioritaire.

### La réponse SAIOT
**SAIOT (Système d'Allocation Intelligente des Opérateurs Textiles)** apporte une réponse instantanée et intelligente :
1. **Détection temps réel** de l'absence et libération automatique du poste.
2. **Scoring mathématique pondéré** des candidats disponibles (polyvalence machine, note de performance historique, impact sur la ligne d'origine).
3. **Audit prédictif par l'IA Google Gemini 2.5 Flash** : Analyse fine du temps d'adaptation, courbe de montée en cadence (*Ramping Time*), risques qualité par type d'article textile, et préconisation catégorique d'arrêt ou de maintien de la ligne.

---

## 🏗️ Architecture Technique

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND REACT (SPA)                           │
│  • React 18 + Vite (Tailwind / Custom CSS Tokens Thème Sombre)         │
│  • Lucide React Icons • Composants Métier Réactifs                    │
│  • Services : apiService.js (REST) + geminiService.js (IA Streaming)   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP REST / JSON (Port 3000)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API (Node.js)                          │
│  • Express.js • CORS • Body-Parser                                    │
│  • Contrôleurs : Auth, Lignes, Postes, Opérateurs, Shifts, Absences    │
│  • Algorithme d'allocation mathématique SAIOT                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ SQL Queries (better-sqlite3)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BASE DE DONNÉES (SQLite)                           │
│  • Fichier embarqué : database/allocation.db (auto-seedé au boot)     │
│  • Tables : Users, Shifts, Lignes, Postes, Operateurs, Competences,   │
│             Certifications, Affectations, Historique_Absences, Param   │
│  • Compatible MySQL/PostgreSQL (script DDL schema.sql fourni)         │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ Google GenAI SDK (gemini-2.5-flash)
┌──────────────────────────────────┴─────────────────────────────────────┐
│                    AGENT IA GOOGLE GEMINI 2.5                          │
│  • Diagnostic décisionnel textuel en temps réel (Streaming)            │
│  • Évaluation des arrêts de ligne, pertes de cadence et qualité        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Fonctionnalités Majeures

### 1. Supervision en Temps Réel des Lignes
- Suivi direct des **3 lignes de confection** :
  - **Ligne 1** : Pantalons Chino (Montage) — Cible : 1 800 pièces/jour.
  - **Ligne 2** : Polos Maille Piquée (Finition) — Cible : 1 500 pièces/jour.
  - **Ligne 3** : T-Shirts Jersey (Assemblage) — Cible : 2 200 pièces/jour.
- Badges visuels : `ACTIF` (vert), `GOULOT` (rouge critique), `POSTE VIDE` (orange d'alerte).
- Calcul dynamique du **TRS usine (OEE)** et de la **Couverture des postes** (ex: 80% ou 100%).

### 2. Moteur Hybride : Algorithme SAIOT & Agent IA Gemini
Lorsqu'un poste est vacant, le système propose le meilleur remplaçant grâce à deux niveaux complémentaires :

#### Niveau 1 — Algorithme de Scoring Mathématique SAIOT :
$$\text{Score} = (W_{comp} \times S_{comp}) + (W_{rating} \times S_{rating}) + (W_{impact} \times S_{impact})$$
- **Compétence** ($W_{comp} = 40\%$) : Adéquation du niveau (1 à 4) par rapport au niveau requis du poste.
- **Rating** ($W_{rating} = 30\%$) : Historique de performance, rigueur et qualité de l'opérateur (sur 5).
- **Impact Ligne** ($W_{impact} = 30\%$) : Bonus accordé aux opérateurs de l'équipe volante pour éviter de déstabiliser une ligne active.

#### Niveau 2 — Agent IA Google Gemini (Diagnostic Décisionnel en Direct) :
En cliquant sur **« Analyser avec Gemini »**, le modèle analyse la situation complète de l'atelier et produit en temps réel :
- **Recommandation d'arrêt de ligne** :
  - 🛑 *Arrêt temporaire recommandé* si le goulot d'étranglement est vide et que l'adaptation dépasse le tampon disponible.
  - 🟡 *Ralentissement temporaire* (cadence réduite pendant le ramping).
  - 🟢 *Maintien à 100% sans interruption*.
- **Temps d'adaptation calculé** (ex: 15 min pour un niveau autonome, 35 min pour un débutant).
- **Courbe de montée en cadence (Ramping Bar)** : Graphique visuel de progression de cadence $T+0$, $T+10\text{min}$, $T+20\text{min}$, $T+30\text{min}$.
- **Perte estimée en nombre de pièces** et plan de contrôle qualité renforcé.

### 3. Authentification Industrielle & 4 Rôles
- Interface de connexion moderne avec protection par mot de passe.
- **Boutons 1-Clic Démo** intégrés directement sur la page d'accueil pour tester chaque profil instantanément.
- Gestion de session persistante (`localStorage` + synchronisation backend).
- Sélecteur rapide de profil dans la barre supérieure et bouton de déconnexion.

### 4. Gestion Multi-Shifts & Quarts de Travail
L'application s'adapte à l'organisation industrielle de l'usine :
- **Choix du nombre de shifts par jour** :
  - **1 Shift** : Journée normale continue (`08:00 - 17:00`).
  - **2 Shifts (2x8)** : Shift 1 Matin (`06:00 - 14:00`) + Shift 2 Après-Midi (`14:00 - 22:00`).
  - **3 Shifts (3x8 Continu - Standard)** : Matin (`06:00 - 14:00`) + Après-Midi (`14:00 - 22:00`) + Nuit (`22:00 - 06:00`).
  - **4 Shifts (4x8)** : Matin + Après-Midi + Nuit + Relève & Week-End (`06:00 - 18:00`).
- **Consultation isolée de chaque shift** :
  - Boutons de bascule rapide en 1 clic dans l'en-tête : `[🌅 Matin]`, `[☀️ Après-midi]`, `[🌙 Nuit]`.
  - Menu déroulant avec objectifs de pièces, volume produit et TRS propre à chaque équipe.
  - **Bannière d'alerte contextuelle** sur le tableau de bord avec bouton de retour instantané au shift principal.

### 5. Matrice de Polyvalence & Certifications Machines
- Vue sous forme de grille interactive de l'ensemble des opérateurs (+20 profils).
- Compétences évaluées de **1 à 4 étoiles** : *Piqueuse Plate, Surjeteuse, Automate Pose Poche, Ourlage Bas, Contrôle Qualité, Coupe Automatisée*.
- Photos de profil réalistes rigoureusement synchronisées avec les prénoms et genres des opérateurs.
- Statut des habilitations machines avec alertes de validité.

### 6. Rapports TRS (OEE) & Suivi de l'Absentéisme
- Graphiques d'efficience hebdomadaire par ligne.
- Taux de disponibilité opérationnelle, cadence moyenne et taux de qualité.
- Historique chronologique des absences déclarées avec motif (Maladie, Congé, Retard transport, etc.) et poste libéré.

### 7. Pondération Personnalisable de l'Algorithme
- Dans l'onglet **Paramètres**, le Chef d'Atelier peut ajuster en direct les curseurs de pondération :
  - Poids Compétence ($W_{comp}$)
  - Poids Rating Opérateur ($W_{rating}$)
  - Poids Impact Ligne ($W_{impact}$)
- Enregistrement immédiat dans la table `Parametres` de la base SQLite.

---

## 🔑 Identifiants de Connexion (Comptes Démo)

| Rôle | Nom & Prénom | Email | Mot de passe | Périmètre des droits |
|---|---|---|---|---|
| **Chef d'Atelier (Admin)** | Rachid Benkirane | `admin@saiot.ma` | `admin123` | **Accès total** : allocation IA, affectation manuelle, paramétrage des poids, configuration des shifts |
| **Directrice de Production** | Leila Tazi | `production@saiot.ma` | `prod123` | Supervision du TRS global, cadences cibles, consultation multi-shifts |
| **Superviseur Lignes** | Tariq Chraibi | `superviseur@saiot.ma` | `sup123` | Terrain : déclaration d'absence immédiate, affectation des remplaçants |
| **Responsable RH** | Nadia Alami | `rh@saiot.ma` | `rh123` | Polyvalence matricielle, certifications machines, suivi de l'absentéisme |

> **Astuce** : Sur la page de connexion, vous pouvez simplement cliquer sur le bouton **`1-Clic ➔`** à côté de chaque compte pour vous connecter sans saisir l'email ni le mot de passe !

---

## ⚡ Démarrage Rapide (Windows)

Le projet intègre un script automatisé tout-en-un qui configure l'environnement, vérifie les dépendances et lance simultanément le Backend API, la base SQLite et le Frontend React :

👉 **Double-cliquez sur `lancer_solution.bat`** (à la racine du projet).

Le script effectue automatiquement :
1. La vérification de **Node.js**.
2. L'installation automatique des dépendances (`npm install` dans `backend` et `frontend` si nécessaire).
3. Le démarrage du serveur Backend Express sur **http://localhost:3000/**.
4. L'initialisation automatique de la base SQLite `database/allocation.db` avec toutes les tables et données de démonstration.
5. Le démarrage du serveur de développement Vite sur **http://localhost:5173/**.
6. L'ouverture automatique de votre navigateur sur l'application.

---

## 🛠️ Installation & Déploiement Manuel

Si vous préférez lancer manuellement le projet en ligne de commande :

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [Git](https://git-scm.com/)

### 1. Cloner le dépôt
```bash
git clone <URL_DU_DEPOT>
cd allocation
```

### 2. Démarrer le Backend (API REST + SQLite)
```bash
cd backend
npm install
node src/server.js
```
Le backend démarre sur `http://localhost:3000`.

### 3. Démarrer le Frontend (React + Vite)
Dans un second terminal :
```bash
cd frontend
npm install
npm run dev
```
L'interface est accessible sur `http://localhost:5173`.

---

## 🤖 Configuration de l'Agent IA (Google Gemini)

L'analyse décisionnelle avancée utilise le SDK officiel Google Gemini (`@google/genai`).

1. Obtenez une clé API gratuite sur [Google AI Studio](https://aistudio.google.com/apikey).
2. Dans le dossier `frontend/`, créez un fichier `.env` (basé sur [`.env.example`](file:///c:/Users/LAPTOP/OneDrive%20-%20ECOLE%20SUP%C3%89RIEURE%20DES%20INDUSTRIES%20DU%20TEXTILE%20ET%20DE%20L'HABILLEMENT/Bureau/allocation/frontend/.env.example)) :
```ini
VITE_GEMINI_API_KEY=votre_cle_api_ici
```
3. Sauvegardez le fichier. L'application prend immédiatement en compte la clé sans redémarrage nécessaire.

> **Note :** Si aucune clé API n'est configurée, l'application fonctionne parfaitement en **mode local autonome** avec l'algorithme mathématique de scoring SAIOT.

---

## 🗄️ Schéma de la Base de Données

Le backend utilise **SQLite embarqué** (`better-sqlite3`), auto-créé et seedé à l'exécution dans `database/allocation.db`. Un script DDL complet pour MySQL/PostgreSQL est également fourni dans [`database/schema.sql`](file:///c:/Users/LAPTOP/OneDrive%20-%20ECOLE%20SUP%C3%89RIEURE%20DES%20INDUSTRIES%20DU%20TEXTILE%20ET%20DE%20L'HABILLEMENT/Bureau/allocation/database/schema.sql).

### Tables principales :
- **`Users`** : Identifiants, mot de passe haché/clair démo, nom, rôle et avatar.
- **`Shifts`** : Définition des quarts (Matin, Après-Midi, Nuit, Weekend), heures, objectifs et production.
- **`Lignes`** : Lignes de confection (Pantalons, Polos, T-Shirts) et cadence cible.
- **`Postes`** : Postes de travail, statut critique (goulot), cadence requise, compétence et certification requise.
- **`Operateurs`** : Liste du personnel (+20 opérateurs), matricule, note globale (rating /5), statut (présent/absent), ligne d'origine.
- **`Operateur_Competence`** : Niveaux de polyvalence (1 à 4) par machine.
- **`Operateur_Certification`** : Habilitations de sécurité et machines spéciales.
- **`Affectations`** : Mapping en direct poste ↔ opérateur.
- **`Historique_Absences`** : Logs horodatés des absences déclarées.
- **`Parametres`** : Poids configurables de l'algorithme ($W_{comp}, W_{rating}, W_{impact}$).

---

## 🌐 Documentation des Endpoints API REST

### Authentification & Utilisateurs
- `POST /api/auth/login` : Vérifie les identifiants et retourne le profil utilisateur.
- `GET /api/auth/users` : Liste les comptes disponibles pour les accès rapides démo.

### Gestion des Shifts
- `GET /api/shifts` : Retourne la liste des shifts et le nombre de shifts actifs.
- `POST /api/shifts/config` : Enregistre le nombre de shifts configuré (1, 2, 3 ou 4) et leur organisation.
- `GET /api/shifts/:shiftId/dashboard` : Métriques et statut des lignes pour un shift spécifique.

### Lignes, Postes & Opérateurs
- `GET /api/lignes` : Retourne les 3 lignes complètes avec leurs postes et les opérateurs affectés.
- `GET /api/operateurs` : Liste tous les opérateurs avec compétences et certifications.
- `POST /api/affectations` : Affecte un opérateur sur un poste précis.
- `POST /api/absences` : Déclare un opérateur absent et libère automatiquement son poste.

### Algorithme & Paramètres
- `POST /api/allocation/candidats` : Exécute le calcul de score SAIOT pour un poste donné.
- `GET /api/parametres` : Récupère les coefficients de pondération.
- `PUT /api/parametres` : Met à jour les coefficients de pondération.
- `GET /api/health` : État de santé de l'API (`{ status: "ok", database: "sqlite" }`).


## 👥 Auteurs :
BENHAYOUN Abderrahmane
SIRAGI Souha
