CREATE DATABASE IF NOT EXISTS saiot_db;
USE saiot_db;

-- 1. Table Lignes
CREATE TABLE Lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL
);

-- 2. Table Compétences (ex: Couture, Coupe, Contrôle qualité)
CREATE TABLE Competences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Table Certifications (ex: Piqueuse plate, Surjeteuse)
CREATE TABLE Certifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE
);

-- 4. Table Postes (ex: Poste Couture 1 sur Ligne A)
CREATE TABLE Postes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ligne_id INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    est_critique BOOLEAN DEFAULT FALSE, -- Indique si le poste est un goulot d'étranglement (bottleneck)
    cadence_standard INT, -- Objectif de pièces par heure (ex: 120)
    competence_requise_id INT,
    niveau_requis INT DEFAULT 1, -- Niveau de 1 à 4
    certification_requise_id INT, -- Peut être NULL si aucune certif n'est requise
    rating_min_recommande DECIMAL(3,2), -- Ex: 4.00 (sur 5)
    FOREIGN KEY (ligne_id) REFERENCES Lignes(id) ON DELETE CASCADE,
    FOREIGN KEY (competence_requise_id) REFERENCES Competences(id),
    FOREIGN KEY (certification_requise_id) REFERENCES Certifications(id)
);

-- 5. Table Opérateurs
CREATE TABLE Operateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricule VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    photo_url VARCHAR(255), -- Très utile pour le tableau de bord visuel
    statut ENUM('present', 'absent', 'en_conge') DEFAULT 'present', -- État du jour
    rating_global DECIMAL(3,2) DEFAULT 3.00, -- Score sur 5, mis à jour par les chefs
    ligne_origine_id INT, -- Ligne d'affectation par défaut
    FOREIGN KEY (ligne_origine_id) REFERENCES Lignes(id)
);

-- 6. Table de liaison Opérateur - Compétences (Niveaux de 1 à 4)
CREATE TABLE Operateur_Competence (
    operateur_id INT NOT NULL,
    competence_id INT NOT NULL,
    niveau INT NOT NULL CHECK (niveau BETWEEN 1 AND 4),
    PRIMARY KEY (operateur_id, competence_id),
    FOREIGN KEY (operateur_id) REFERENCES Operateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES Competences(id) ON DELETE CASCADE
);

-- 7. Table de liaison Opérateur - Certifications
CREATE TABLE Operateur_Certification (
    operateur_id INT NOT NULL,
    certification_id INT NOT NULL,
    date_validite DATE NOT NULL,
    PRIMARY KEY (operateur_id, certification_id),
    FOREIGN KEY (operateur_id) REFERENCES Operateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (certification_id) REFERENCES Certifications(id) ON DELETE CASCADE
);

-- 8. Table Affectations (Journal des affectations quotidiennes)
CREATE TABLE Affectations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operateur_id INT NOT NULL,
    poste_id INT NOT NULL,
    date_affectation DATE NOT NULL,
    statut ENUM('actif', 'remplace', 'termine') DEFAULT 'actif',
    FOREIGN KEY (operateur_id) REFERENCES Operateurs(id),
    FOREIGN KEY (poste_id) REFERENCES Postes(id)
);

-- 9. Table Absences
CREATE TABLE Absences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operateur_id INT NOT NULL,
    date_absence DATE NOT NULL,
    motif VARCHAR(255),
    FOREIGN KEY (operateur_id) REFERENCES Operateurs(id)
);
