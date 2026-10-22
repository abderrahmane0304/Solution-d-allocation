import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'saiot.db');
export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  // Activer les clés étrangères
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Table Lignes
  db.exec(`
    CREATE TABLE IF NOT EXISTS Lignes (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      efficience INTEGER DEFAULT 90,
      objectif INTEGER DEFAULT 1800,
      production INTEGER DEFAULT 1600
    );
  `);

  // 2. Table Compétences
  db.exec(`
    CREATE TABLE IF NOT EXISTS Competences (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE
    );
  `);

  // 3. Table Certifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS Certifications (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE
    );
  `);

  // 4. Table Postes
  db.exec(`
    CREATE TABLE IF NOT EXISTS Postes (
      id INTEGER PRIMARY KEY,
      ligne_id INTEGER NOT NULL,
      nom TEXT NOT NULL,
      est_critique BOOLEAN DEFAULT 0,
      cadence INTEGER DEFAULT 120,
      competence TEXT NOT NULL,
      niveau_requis INTEGER DEFAULT 1,
      FOREIGN KEY (ligne_id) REFERENCES Lignes(id) ON DELETE CASCADE
    );
  `);

  // 5. Table Opérateurs
  db.exec(`
    CREATE TABLE IF NOT EXISTS Operateurs (
      id INTEGER PRIMARY KEY,
      matricule TEXT NOT NULL UNIQUE,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      photo_url TEXT,
      statut TEXT DEFAULT 'present',
      rating_global REAL DEFAULT 4.0,
      ligne_origine TEXT,
      absences_mois INTEGER DEFAULT 0
    );
  `);

  // 6. Liaison Opérateur - Compétences
  db.exec(`
    CREATE TABLE IF NOT EXISTS Operateur_Competence (
      operateur_id INTEGER NOT NULL,
      competence TEXT NOT NULL,
      niveau INTEGER NOT NULL,
      PRIMARY KEY (operateur_id, competence),
      FOREIGN KEY (operateur_id) REFERENCES Operateurs(id) ON DELETE CASCADE
    );
  `);

  // 7. Liaison Opérateur - Certifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS Operateur_Certification (
      operateur_id INTEGER NOT NULL,
      certification TEXT NOT NULL,
      date_validite TEXT,
      PRIMARY KEY (operateur_id, certification),
      FOREIGN KEY (operateur_id) REFERENCES Operateurs(id) ON DELETE CASCADE
    );
  `);

  // 8. Affectations actives (Poste <-> Opérateur)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Affectations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poste_id INTEGER NOT NULL UNIQUE,
      operateur_id INTEGER,
      date_affectation TEXT DEFAULT (DATE('now')),
      FOREIGN KEY (poste_id) REFERENCES Postes(id),
      FOREIGN KEY (operateur_id) REFERENCES Operateurs(id)
    );
  `);

  // 9. Table Absences
  db.exec(`
    CREATE TABLE IF NOT EXISTS Absences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operateur_id INTEGER NOT NULL,
      poste_nom TEXT,
      date_absence TEXT DEFAULT (DATE('now')),
      motif TEXT,
      statut TEXT DEFAULT 'Non couvert',
      remplacant_id INTEGER,
      FOREIGN KEY (operateur_id) REFERENCES Operateurs(id)
    );
  `);

  // 10. Table Paramètres (Pondération algorithme)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Parametres (
      cle TEXT PRIMARY KEY,
      valeur REAL NOT NULL
    );
  `);

  // 11. Table Utilisateurs (Authentification et Rôles)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      role TEXT NOT NULL,
      role_label TEXT NOT NULL,
      avatar TEXT
    );
  `);

  // 12. Table Shifts (Gestion des roulements d'équipes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS Shifts (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      nom TEXT NOT NULL,
      heures TEXT NOT NULL,
      equipe TEXT NOT NULL,
      objectif INTEGER DEFAULT 5000,
      production INTEGER DEFAULT 4500,
      efficience INTEGER DEFAULT 90,
      actif BOOLEAN DEFAULT 1
    );
  `);

  // Vérifier si des données existent déjà
  const row = db.prepare('SELECT COUNT(*) as count FROM Lignes').get();
  if (row.count === 0) {
    seedDatabase();
  }

  // Seed Utilisateurs si la table est vide
  const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO Users (email, password, nom, prenom, role, role_label, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('admin@saiot.ma', 'admin123', 'Benkirane', 'Rachid', 'admin', "Chef d'Atelier (Admin)", 'https://randomuser.me/api/portraits/men/51.jpg');
    insertUser.run('production@saiot.ma', 'prod123', 'Tazi', 'Leila', 'production', 'Directrice Production', 'https://randomuser.me/api/portraits/women/44.jpg');
    insertUser.run('superviseur@saiot.ma', 'sup123', 'Chraibi', 'Tariq', 'superviseur', 'Superviseur Lignes', 'https://randomuser.me/api/portraits/men/32.jpg');
    insertUser.run('rh@saiot.ma', 'rh123', 'Alaoui', 'Salma', 'rh', 'Responsable RH', 'https://randomuser.me/api/portraits/women/68.jpg');
  }

  // Seed Shifts si la table est vide
  const shiftCount = db.prepare('SELECT COUNT(*) as count FROM Shifts').get();
  if (shiftCount.count === 0) {
    const insertShift = db.prepare(`
      INSERT INTO Shifts (id, code, nom, heures, equipe, objectif, production, efficience, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertShift.run(1, 'Matin', 'Shift Matin (06:00 - 14:00)', '06:00 - 14:00', 'Équipe Alpha (Matin)', 5500, 5014, 91, 1);
    insertShift.run(2, 'ApresMidi', 'Shift Après-Midi (14:00 - 22:00)', '14:00 - 22:00', 'Équipe Bravo (Après-Midi)', 4800, 4210, 88, 1);
    insertShift.run(3, 'Nuit', 'Shift Nuit (22:00 - 06:00)', '22:00 - 06:00', 'Équipe Charlie (Nuit)', 3200, 2950, 92, 1);
    insertShift.run(4, 'Weekend', 'Shift Weekend & Relève (06:00 - 18:00)', '06:00 - 18:00', 'Équipe Delta (Relève)', 2500, 2320, 93, 0);
  }
}

function seedDatabase() {
  console.log('[SAIOT-DB] Initialisation des données initiales textile...');

  // Lignes
  const insertLigne = db.prepare('INSERT INTO Lignes (id, nom, efficience, objectif, production) VALUES (?, ?, ?, ?, ?)');
  insertLigne.run(1, 'Ligne 1 - Pantalons Chino (Montage)', 94, 1800, 1692);
  insertLigne.run(2, 'Ligne 2 - Polos Piqué (Finition)', 88, 1500, 1320);
  insertLigne.run(3, 'Ligne 3 - T-Shirts Jersey (Assemblage)', 91, 2200, 2002);

  // Postes
  const insertPoste = db.prepare('INSERT INTO Postes (id, ligne_id, nom, est_critique, cadence, competence, niveau_requis) VALUES (?, ?, ?, ?, ?, ?, ?)');
  // Ligne 1
  insertPoste.run(101, 1, 'Surjeteuse 5 fils (Côtés)', 0, 120, 'Surjeteuse', 2);
  insertPoste.run(102, 1, 'Automate Pose Poche', 1, 180, 'Automatiste', 4);
  insertPoste.run(103, 1, 'Piqueuse Plate (Braguette)', 1, 90, 'Piqueuse Plate', 3);
  insertPoste.run(104, 1, 'Ourlage Bas', 0, 150, 'Ourlage', 2);
  // Ligne 2
  insertPoste.run(201, 2, 'Pose Col (Surjeteuse)', 1, 140, 'Surjeteuse', 3);
  insertPoste.run(202, 2, 'Plaquage Patte Boutonnage', 1, 110, 'Piqueuse Plate', 3);
  insertPoste.run(203, 2, 'Contrôle Qualité Final', 0, 200, 'Contrôle Qualité', 2);
  // Ligne 3
  insertPoste.run(301, 3, 'Assemblage Épaules', 0, 160, 'Surjeteuse', 2);
  insertPoste.run(302, 3, 'Pose Manches', 1, 130, 'Surjeteuse', 3);
  insertPoste.run(303, 3, 'Fermeture Côtés', 0, 150, 'Surjeteuse', 2);

  // Opérateurs
  const insertOp = db.prepare(`
    INSERT INTO Operateurs (id, matricule, nom, prenom, photo_url, statut, rating_global, ligne_origine, absences_mois)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOp.run(1, 'OP-001', 'Benali', 'Ali', 'https://randomuser.me/api/portraits/men/32.jpg', 'present', 4.8, 'Ligne 1', 0);
  insertOp.run(2, 'OP-002', 'Zahra', 'Fatima', 'https://randomuser.me/api/portraits/women/44.jpg', 'present', 4.9, 'Volante', 0);
  insertOp.run(3, 'OP-003', 'Leroy', 'Sarah', 'https://randomuser.me/api/portraits/women/68.jpg', 'present', 4.9, 'Ligne 1', 1);
  insertOp.run(4, 'OP-004', 'El Fassi', 'Youssef', 'https://randomuser.me/api/portraits/men/46.jpg', 'present', 3.9, 'Ligne 1', 2);
  insertOp.run(5, 'OP-005', 'Durand', 'Marie', 'https://randomuser.me/api/portraits/women/12.jpg', 'present', 4.5, 'Ligne 2', 1);
  insertOp.run(6, 'OP-006', 'Ziani', 'Karim', 'https://randomuser.me/api/portraits/men/75.jpg', 'present', 4.7, 'Ligne 2', 0);
  insertOp.run(7, 'OP-007', 'Berrada', 'Amine', 'https://randomuser.me/api/portraits/men/22.jpg', 'present', 4.5, 'Ligne 3', 1);
  insertOp.run(8, 'OP-008', 'Mansour', 'Laila', 'https://randomuser.me/api/portraits/women/26.jpg', 'present', 4.2, 'Ligne 3', 3);
  insertOp.run(9, 'OP-009', 'Tahiri', 'Omar', 'https://randomuser.me/api/portraits/men/86.jpg', 'absent', 3.7, 'Ligne 3', 4);
  insertOp.run(10, 'OP-010', 'Lami', 'Nadia', 'https://randomuser.me/api/portraits/women/50.jpg', 'present', 3.8, 'Volante', 2);

  // Compétences
  const insertComp = db.prepare('INSERT INTO Operateur_Competence (operateur_id, competence, niveau) VALUES (?, ?, ?)');
  insertComp.run(1, 'Surjeteuse', 4); insertComp.run(1, 'Piqueuse Plate', 3); insertComp.run(1, 'Ourlage', 2);
  insertComp.run(2, 'Automatiste', 4); insertComp.run(2, 'Surjeteuse', 4); insertComp.run(2, 'Piqueuse Plate', 4); insertComp.run(2, 'Ourlage', 3);
  insertComp.run(3, 'Piqueuse Plate', 4); insertComp.run(3, 'Surjeteuse', 3); insertComp.run(3, 'Ourlage', 2);
  insertComp.run(4, 'Ourlage', 3); insertComp.run(4, 'Surjeteuse', 2);
  insertComp.run(5, 'Surjeteuse', 4); insertComp.run(5, 'Piqueuse Plate', 2); insertComp.run(5, 'Contrôle Qualité', 3);
  insertComp.run(6, 'Piqueuse Plate', 4); insertComp.run(6, 'Surjeteuse', 3);
  insertComp.run(7, 'Surjeteuse', 3); insertComp.run(7, 'Ourlage', 2);
  insertComp.run(8, 'Surjeteuse', 3); insertComp.run(8, 'Contrôle Qualité', 2);
  insertComp.run(9, 'Surjeteuse', 2);
  insertComp.run(10, 'Automatiste', 2); insertComp.run(10, 'Piqueuse Plate', 3); insertComp.run(10, 'Surjeteuse', 3); insertComp.run(10, 'Ourlage', 3);

  // Certifications
  const insertCert = db.prepare('INSERT INTO Operateur_Certification (operateur_id, certification, date_validite) VALUES (?, ?, ?)');
  insertCert.run(1, 'Automate Barudan', '2027-01-01');
  insertCert.run(1, 'Coupe Gerber', '2027-01-01');
  insertCert.run(2, 'Automate Barudan', '2027-06-01');
  insertCert.run(2, 'Coupe Gerber', '2027-06-01');
  insertCert.run(2, 'Thermocollage', '2027-06-01');
  insertCert.run(3, 'Automate Barudan', '2027-03-01');
  insertCert.run(5, 'Thermocollage', '2027-05-01');
  insertCert.run(6, 'Coupe Gerber', '2027-04-01');
  insertCert.run(10, 'Automate Barudan', '2026-10-25'); // Expirante sous peu

  // Affectations initiales (Poste 102 et 203 sont initialement vacants !)
  const insertAff = db.prepare('INSERT INTO Affectations (poste_id, operateur_id) VALUES (?, ?)');
  insertAff.run(101, 1); // Ali Benali sur Surjeteuse L1
  insertAff.run(102, null); // Automate Pose Poche : VACANT
  insertAff.run(103, 3); // Sarah Leroy sur Piqueuse L1
  insertAff.run(104, 4); // Youssef El Fassi sur Ourlage L1

  insertAff.run(201, 5); // Marie Durand sur Pose Col L2
  insertAff.run(202, 6); // Karim Ziani sur Patte Boutonnage L2
  insertAff.run(203, null); // Contrôle Qualité : VACANT

  insertAff.run(301, 7); // Amine Berrada sur Assemblage L3
  insertAff.run(302, 8); // Laila Mansour sur Pose Manches L3
  insertAff.run(303, null); // Omar Tahiri est absent, poste vacant ou couvert

  // Paramètres initiaux
  const insertParam = db.prepare('INSERT INTO Parametres (cle, valeur) VALUES (?, ?)');
  insertParam.run('poids_competence', 40);
  insertParam.run('poids_rating', 30);
  insertParam.run('poids_impact', 30);

  // Historique Absences
  const insertAbs = db.prepare('INSERT INTO Absences (operateur_id, poste_nom, date_absence, motif, statut) VALUES (?, ?, ?, ?, ?)');
  insertAbs.run(9, 'Fermeture Côtés', '2026-10-21', 'Maladie', 'Non couvert');
  insertAbs.run(1, 'Surjeteuse 5 fils', '2026-10-20', 'Congé exceptionnel', 'Couvert');
  insertAbs.run(10, 'Volante', '2026-10-19', 'Absence justifiée', 'Couvert');
  insertAbs.run(5, 'Pose Col', '2026-10-18', 'Rendez-vous médical', 'Couvert');

  console.log('[SAIOT-DB] Base de données initialisée avec succès.');
}
