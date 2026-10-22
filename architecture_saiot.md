# 🏗️ Architecture Complète — SAIOT
### Système d'Allocation Intelligente des Opérateurs Textiles

---

## 📁 Arborescence Cible du Projet

```
allocation/
│
├── 📄 README.md
├── 📄 .gitignore
├── 📄 docker-compose.yml            # Orchestration DB + Backend + Frontend
│
├── 📂 database/
│   ├── schema.sql                   # DDL : création des tables
│   ├── seeds/
│   │   ├── 01_lignes.sql            # Données initiales : lignes de prod
│   │   ├── 02_competences.sql       # Compétences référentielles
│   │   ├── 03_certifications.sql    # Certifications de machines
│   │   └── 04_operateurs.sql        # Opérateurs de démonstration
│   └── migrations/
│       └── v1.0.0_initial.sql
│
├── 📂 backend/
│   ├── 📄 package.json
│   ├── 📄 .env.example
│   ├── 📄 server.js                 # Point d'entrée Express
│   │
│   └── 📂 src/
│       ├── 📂 config/
│       │   ├── db.js                # Connexion MySQL (pool)
│       │   └── constants.js         # WEIGHTS, enums, config globale
│       │
│       ├── 📂 middleware/
│       │   ├── auth.js              # JWT verify + rôle guard
│       │   └── errorHandler.js      # Gestionnaire d'erreurs global
│       │
│       ├── 📂 models/               # Requêtes SQL (DAL)
│       │   ├── Operateur.model.js
│       │   ├── Poste.model.js
│       │   ├── Ligne.model.js
│       │   ├── Absence.model.js
│       │   └── Affectation.model.js
│       │
│       ├── 📂 services/             # Logique métier pure
│       │   ├── allocationService.js # ✅ EXISTANT — Algorithme Smart Matching
│       │   ├── authService.js       # Hash mdp, génération JWT
│       │   └── alertService.js      # Détection certifs expirées, alertes
│       │
│       ├── 📂 controllers/          # Reçoit req, appelle service, renvoie res
│       │   ├── auth.controller.js
│       │   ├── operateurs.controller.js
│       │   ├── lignes.controller.js
│       │   ├── postes.controller.js
│       │   ├── absences.controller.js
│       │   ├── affectations.controller.js
│       │   └── allocation.controller.js
│       │
│       └── 📂 routes/               # Déclaration des endpoints REST
│           ├── index.js             # Agrège toutes les routes
│           ├── auth.routes.js
│           ├── operateurs.routes.js
│           ├── lignes.routes.js
│           ├── postes.routes.js
│           ├── absences.routes.js
│           ├── affectations.routes.js
│           └── allocation.routes.js
│
└── 📂 frontend/
    ├── 📄 package.json
    ├── 📄 vite.config.js
    ├── 📄 index.html
    │
    └── 📂 src/
        ├── 📄 main.jsx              # Point d'entrée React
        ├── 📄 App.jsx               # Router principal
        ├── 📄 index.css             # Variables CSS globales (tokens)
        │
        ├── 📂 assets/               # Logos, icônes statiques
        │
        ├── 📂 api/                  # Couche d'appels HTTP (axios)
        │   ├── client.js            # Instance axios + intercepteurs
        │   ├── operateurs.api.js
        │   ├── lignes.api.js
        │   ├── absences.api.js
        │   └── allocation.api.js
        │
        ├── 📂 context/              # State global (React Context)
        │   ├── AuthContext.jsx      # Gestion session utilisateur
        │   └── ProductionContext.jsx # État temps-réel des lignes
        │
        ├── 📂 hooks/                # Hooks réutilisables
        │   ├── useAuth.js
        │   ├── useLignes.js
        │   └── useAllocation.js
        │
        ├── 📂 components/           # Composants UI réutilisables
        │   ├── 📂 common/
        │   │   ├── Badge.jsx        # StatusBadge (vert/rouge/orange)
        │   │   ├── KpiCard.jsx
        │   │   ├── AlertItem.jsx
        │   │   ├── Modal.jsx        # Wrapper modal générique
        │   │   └── Avatar.jsx
        │   │
        │   ├── 📂 layout/
        │   │   ├── Sidebar.jsx
        │   │   ├── Topbar.jsx
        │   │   └── AppLayout.jsx
        │   │
        │   ├── 📂 dashboard/
        │   │   ├── LigneCard.jsx    # Carte d'une ligne de production
        │   │   ├── PosteSlot.jsx    # Carte d'un poste (drag-droppable)
        │   │   └── AlertsPanel.jsx  # Panneau événements temps réel
        │   │
        │   ├── 📂 allocation/
        │   │   ├── AiAgentModal.jsx # ✅ EXISTANT — Modal IA remplaçants
        │   │   └── CandidatCard.jsx # Carte candidat avec score
        │   │
        │   └── 📂 operateurs/
        │       ├── OperateurForm.jsx
        │       └── MatriceCompetences.jsx
        │
        └── 📂 pages/                # Vues principales (routées)
            ├── LoginPage.jsx        # Authentification
            ├── DashboardPage.jsx    # ✅ EXISTANT — Vue principale
            ├── LignesPage.jsx       # Config lignes & postes
            ├── OperateursPage.jsx   # Gestion RH opérateurs
            ├── PolyvalencePage.jsx  # Matrice de polyvalence
            ├── RapportsPage.jsx     # KPIs, TRS, absentéisme
            └── ParametresPage.jsx   # Rôles, utilisateurs, config
```

---

## 🔗 Architecture en Couches (Layered Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)             │
│  pages/ ──► components/ ──► hooks/ ──► api/ (axios)    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST (JSON)
                        │ Port 5173 → 3000
┌───────────────────────▼─────────────────────────────────┐
│                   BACKEND (Node.js / Express)           │
│  routes/ ──► controllers/ ──► services/ ──► models/    │
└───────────────────────┬─────────────────────────────────┘
                        │ SQL Queries
┌───────────────────────▼─────────────────────────────────┐
│                  BASE DE DONNÉES (MySQL)                 │
│  Lignes │ Postes │ Operateurs │ Affectations │ Absences  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 API REST — Endpoints Complets

| Méthode | Endpoint                              | Description                               | Rôle requis       |
|---------|---------------------------------------|-------------------------------------------|-------------------|
| `POST`  | `/api/auth/login`                     | Connexion, retourne JWT                   | Public            |
| `GET`   | `/api/lignes`                         | Liste toutes les lignes + postes          | Tous              |
| `GET`   | `/api/lignes/:id/postes`              | Postes d'une ligne                        | Tous              |
| `GET`   | `/api/operateurs`                     | Liste tous les opérateurs                 | Tous              |
| `POST`  | `/api/operateurs`                     | Créer un opérateur                        | Admin             |
| `PUT`   | `/api/operateurs/:id/rating`          | Mettre à jour le rating                   | Chef d'atelier    |
| `POST`  | `/api/absences`                       | Déclarer une absence                      | Chef d'atelier    |
| `GET`   | `/api/absences/today`                 | Absences du jour                          | Tous              |
| `POST`  | `/api/affectations`                   | Affecter un opérateur à un poste          | Chef d'atelier    |
| `GET`   | `/api/affectations/today`             | Snapshot des affectations du jour         | Tous              |
| `GET`   | `/api/allocation/remplacants/:posteId`| 🧠 **Algorithme IA** — liste remplaçants | Chef d'atelier    |
| `GET`   | `/api/rapports/kpis`                  | Taux de couverture, absentéisme, OEE      | RH / Admin        |

---

## 🧠 Algorithme Smart Matching — Flux de Décision

```
Poste libéré (absence déclarée)
          │
          ▼
┌─────────────────────┐
│ Filtre éliminatoire │ ── Certification valide ? ──► NON ──► Éliminé ❌
│ (obligatoire)       │
└────────┬────────────┘
         │ OUI
         ▼
┌─────────────────────┐
│ Score = 0           │
│ Compétences (×0.4)  │ niveau_maîtrise / 4 × 100
│ Rating global(×0.3) │ rating_global / 5 × 100
│ Impact ligne (×0.3) │ Volant=100 | Même ligne=50 | Autre ligne=0
└────────┬────────────┘
         │
         ▼  (pénalité -20 si sous-qualifié)
┌─────────────────────┐
│ Tri décroissant     │ Score final 0–100
│ des candidats       │
└────────┬────────────┘
         │
         ▼
   TOP 3 présentés à l'IA Modal avec analyse Points Forts / Risques
```

---

## 🗄️ Schéma Base de Données (Entités & Relations)

```
Lignes ──────< Postes >────── Competences
                  │                 │
                  │           Certifications
                  │
             Affectations >──── Operateurs ──< Operateur_Competence
                                    │
                               Absences     ──< Operateur_Certification
```

**Tables existantes dans `schema.sql` :**

| Table                   | Rôle                                               |
|-------------------------|----------------------------------------------------|
| `Lignes`                | 3 lignes de production                             |
| `Postes`                | Postes par ligne + prérequis (compétence, certif)  |
| `Competences`           | Référentiel des compétences (Couture, Coupe…)      |
| `Certifications`        | Habilitations machines avec date_validite           |
| `Operateurs`            | Fiche opérateur + rating + statut du jour          |
| `Operateur_Competence`  | Niveau de maîtrise (1–4) par opérateur             |
| `Operateur_Certification`| Dates de validité par opérateur                   |
| `Affectations`          | Journal quotidien des affectations                 |
| `Absences`              | Déclarations d'absences avec motif                 |

---

## 🔐 Gestion des Rôles & Sécurité

| Fonctionnalité                  | Administrateur | Chef d'Atelier | RH (Lecteur) |
|---------------------------------|:--------------:|:--------------:|:------------:|
| Voir le tableau de bord         | ✅             | ✅             | ✅           |
| Déclarer une absence            | ✅             | ✅             | ❌           |
| Affecter un opérateur           | ✅             | ✅             | ❌           |
| Modifier le rating              | ✅             | ✅             | ❌           |
| Créer/supprimer un opérateur    | ✅             | ❌             | ❌           |
| Configurer les lignes/postes    | ✅             | ❌             | ❌           |
| Consulter les rapports          | ✅             | ✅             | ✅           |
| Gérer les utilisateurs          | ✅             | ❌             | ❌           |

**Stack Sécurité :** JWT (`jsonwebtoken`) + bcrypt + middleware de rôle sur chaque route

---

## 🛣️ Plan de Développement (Roadmap)

### ✅ V1.0 — Actuel (Frontend seul)
- [x] Dashboard temps réel avec données mock
- [x] Visualisation lignes & postes (code couleur)
- [x] Modal IA avec analyse Smart Matching (mock)
- [x] Algorithme de scoring (`allocationService.js`)
- [x] Schéma base de données

### 🔨 V1.1 — Backend API (Prochain sprint)
- [ ] Setup Express + connexion MySQL
- [ ] CRUD Opérateurs, Lignes, Postes
- [ ] Endpoint `/allocation/remplacants/:posteId` (algorithme réel)
- [ ] Système d'authentification JWT

### 🔌 V1.2 — Connexion Frontend ↔ Backend
- [ ] Remplacer les données mock par les appels API
- [ ] Context `AuthContext` + page Login
- [ ] Context `ProductionContext` avec état réel

### 📊 V1.3 — Modules complets
- [ ] Page Opérateurs (CRUD + matrice compétences)
- [ ] Page Rapports (KPIs, TRS, absentéisme)
- [ ] Alertes certifications expirées

### 🚀 V2.0 — Évolutions futures
- [ ] Drag & Drop pour affectations manuelles
- [ ] Intégration système de pointage (badgeuses)
- [ ] Module ML de prédiction des besoins en formation
- [ ] Scalabilité >3 lignes & >100 opérateurs
