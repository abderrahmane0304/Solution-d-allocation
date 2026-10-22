# Cahier des Charges : Système d'Allocation Intelligente des Opérateurs Textiles (SAIOT)

## 1. Présentation du Projet
### 1.1 Contexte
Dans le cadre de l'optimisation de la production textile, l'usine gère actuellement 3 lignes de production et une équipe de plus de 20 opérateurs. Chaque opérateur possède des compétences variées (couture, coupe, assemblage, contrôle qualité, etc.) et des certifications spécifiques (utilisation de machines spéciales, sécurité, etc.). 

### 1.2 Objectif
Le projet vise à développer une application logicielle permettant d'automatiser et d'optimiser l'affectation quotidienne des opérateurs sur les différents postes de travail. L'objectif principal est de gérer efficacement les absences imprévues en proposant instantanément le meilleur remplaçant grâce à un système de *rating* (évaluation des compétences et performances), assurant ainsi la continuité de la production.

---

## 2. Périmètre du Projet
*   **Lignes de production :** 3 lignes actives.
*   **Effectif :** +20 opérateurs.
*   **Utilisateurs cibles :** Chef d'atelier, Responsable de production, Service RH.
*   **Environnement :** Application Web (accessible sur PC pour le bureau et tablette pour l'atelier).

---

## 3. Spécifications Fonctionnelles

### 3.1 Gestion des Ressources Humaines (Opérateurs)
*   **Profils Opérateurs :** Création, modification et suppression des fiches opérateurs (Nom, Prénom, Matricule).
*   **Matrice des Compétences :** Attribution de compétences spécifiques à chaque opérateur avec un niveau de maîtrise (ex: débutant, intermédiaire, expert).
*   **Gestion des Certifications :** Suivi des habilitations sur machines spéciales avec dates de validité (alertes d'expiration).
*   **Système de Rating (Évaluation) :** 
    *   Chaque opérateur possède un score global (rating) basé sur sa rapidité, la qualité de son travail (taux de rebut), et sa fiabilité.
    *   Ce rating est mis à jour régulièrement par les chefs d'atelier.

### 3.2 Gestion de la Production (Lignes et Postes)
*   **Configuration des Lignes :** Modélisation des 3 lignes de production.
*   **Définition des Postes :** Chaque ligne est divisée en plusieurs postes de travail.
*   **Exigences du Poste :** Pour chaque poste, le système doit définir les prérequis obligatoires :
    *   Compétences nécessaires.
    *   Certifications obligatoires.
    *   Niveau de rating minimum recommandé (facultatif).

### 3.3 Moteur d'Allocation et Réallocation Dynamique (Cœur du système)
*   **Allocation Initiale :** Affectation automatique ou manuelle (par glisser-déposer) des opérateurs sur les postes au début de la journée.
*   **Gestion des Absences :** Déclaration rapide de l'absence d'un opérateur (maladie, retard, congé).
*   **Algorithme de Remplacement (Smart Matching) :** Lorsqu'un poste se libère suite à une absence, le système propose une liste de remplaçants triés selon :
    1.  *Validité de la certification* (Filtre éliminatoire : l'opérateur a-t-il le droit d'utiliser cette machine ?).
    2.  *Correspondance des compétences* (Le remplaçant sait-il faire le travail ?).
    3.  *Le système de Rating* (Trie les opérateurs qualifiés du meilleur au moins performant sur cette tâche précise).
    4.  *Impact sur les autres lignes* (Privilégier un opérateur "volant" ou non affecté plutôt que de désorganiser une autre ligne critique).

### 3.4 Tableau de Bord (Dashboard)
*   Vue visuelle et temps réel des 3 lignes de production.
*   Code couleur pour l'état des postes : 
    *   Vert : Poste pourvu et opérationnel.
    *   Rouge : Poste critique vide (absence signalée).
    *   Orange : Poste pourvu mais opérateur sous-qualifié (mode dégradé).
*   Indicateurs de performance (Taux d'absentéisme, taux de couverture des postes).

---

## 4. Spécifications Techniques

### 4.1 Architecture et Technologies
*   **Type d'application :** Application Web (SaaS ou hébergée localement selon la politique de l'entreprise).
*   **Interface Utilisateur (Front-end) :** Interface responsive (React, Vue.js ou Angular) adaptée aux écrans tactiles (tablettes) pour une utilisation en atelier.
*   **Logique Métier (Back-end) :** API robuste (Node.js, Python/Django, ou Java/Spring) pour gérer l'algorithme de matching.
*   **Base de données :** Base de données relationnelle (PostgreSQL ou MySQL) pour garantir l'intégrité des liens entre opérateurs, compétences et certifications.

### 4.2 Sécurité et Droits d'Accès
*   **Authentification :** Connexion sécurisée avec identifiant et mot de passe.
*   **Rôles utilisateurs :**
    *   *Administrateur* : Accès total (configuration des lignes, gestion des droits).
    *   *Chef d'atelier* : Affectation quotidienne, déclaration des absences, mise à jour du rating.
    *   *Consultant (RH)* : Vue en lecture seule et extraction de rapports.

---

## 5. Ergonomie et Design (UI/UX)
*   **Simplicité :** L'interface doit être épurée. Les chefs d'atelier travaillent dans un environnement rapide et n'ont pas de temps à perdre avec des menus complexes.
*   **Drag & Drop :** Utilisation intensive du glisser-déposer pour affecter un opérateur d'une liste d'attente vers un poste de travail.
*   **Alertes visuelles :** Notifications pop-up ou bannières claires lorsqu'un opérateur est absent ou qu'une certification est expirée.

---

## 6. Évolutions Futures (V2)
*   Évolutivité prévue pour gérer plus de 3 lignes et plus de 100 opérateurs.
*   Intégration avec le système de pointage (badgeuses) pour déclarer automatiquement les absences.
*   Module de Machine Learning pour prédire les besoins en formation en analysant les postes les plus difficiles à combler lors des absences.