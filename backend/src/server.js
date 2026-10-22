import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';

// Initialisation de la base SQLite
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── 1. Healthcheck ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SAIOT Backend API', version: '1.0.0', time: new Date() });
});

// ─── 2. Lignes & Postes (avec opérateurs affectés en temps réel) ───────────────
app.get('/api/lignes', (req, res) => {
  try {
    const lignes = db.prepare('SELECT * FROM Lignes ORDER BY id ASC').all();
    const postes = db.prepare('SELECT * FROM Postes ORDER BY id ASC').all();
    const affectations = db.prepare('SELECT * FROM Affectations').all();
    const operateurs = db.prepare('SELECT * FROM Operateurs').all();

    // Mapping des affectations
    const affMap = {};
    for (const a of affectations) {
      affMap[a.poste_id] = a.operateur_id;
    }

    const opMap = {};
    for (const o of operateurs) {
      opMap[o.id] = {
        id: o.id,
        matricule: o.matricule,
        nom: `${o.prenom} ${o.nom}`,
        photo: o.photo_url,
        rating: o.rating_global,
        statut: o.statut,
        ligne_origine: o.ligne_origine
      };
    }

    const result = lignes.map(ligne => {
      const lignePostes = postes.filter(p => p.ligne_id === ligne.id).map(p => {
        const opId = affMap[p.id];
        const op = opId ? opMap[opId] || null : null;
        return {
          id: p.id,
          nom: p.nom,
          est_critique: Boolean(p.est_critique),
          cadence: p.cadence,
          competence: p.competence,
          niveau_requis: p.niveau_requis,
          operateur: op
        };
      });

      return {
        id: ligne.id,
        nom: ligne.nom,
        efficience: ligne.efficience,
        objectif: ligne.objectif,
        production: ligne.production,
        postes: lignePostes
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Erreur GET /api/lignes:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. Opérateurs (avec compétences et certifications) ───────────────────────
app.get('/api/operateurs', (req, res) => {
  try {
    const operateurs = db.prepare('SELECT * FROM Operateurs ORDER BY id ASC').all();
    const competences = db.prepare('SELECT * FROM Operateur_Competence').all();
    const certifications = db.prepare('SELECT * FROM Operateur_Certification').all();

    const compMap = {};
    for (const c of competences) {
      if (!compMap[c.operateur_id]) compMap[c.operateur_id] = {};
      compMap[c.operateur_id][c.competence] = c.niveau;
    }

    const certMap = {};
    for (const c of certifications) {
      if (!certMap[c.operateur_id]) certMap[c.operateur_id] = [];
      certMap[c.operateur_id].push(c.certification);
    }

    const result = operateurs.map(o => ({
      id: o.id,
      matricule: o.matricule,
      nom: o.nom,
      prenom: o.prenom,
      photo: o.photo_url,
      rating: o.rating_global,
      statut: o.statut,
      ligne_origine: o.ligne_origine,
      absences_mois: o.absences_mois,
      competences: compMap[o.id] || {},
      certifications: certMap[o.id] || []
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur GET /api/operateurs:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. Déclarer une absence (libère automatiquement le poste) ────────────────
app.post('/api/absences', (req, res) => {
  const { operateur_id, motif } = req.body;
  if (!operateur_id) {
    return res.status(400).json({ error: 'operateur_id est requis' });
  }

  try {
    // 1. Mettre à jour le statut de l'opérateur
    db.prepare("UPDATE Operateurs SET statut = 'absent', absences_mois = absences_mois + 1 WHERE id = ?").run(operateur_id);

    // 2. Trouver le poste que cet opérateur occupait
    const aff = db.prepare('SELECT poste_id FROM Affectations WHERE operateur_id = ?').get(operateur_id);
    let posteNom = 'Non affecté';

    if (aff) {
      const p = db.prepare('SELECT nom FROM Postes WHERE id = ?').get(aff.poste_id);
      if (p) posteNom = p.nom;
      // Libérer le poste
      db.prepare('UPDATE Affectations SET operateur_id = NULL WHERE poste_id = ?').run(aff.poste_id);
    }

    // 3. Enregistrer l'absence dans l'historique
    const info = db.prepare(`
      INSERT INTO Absences (operateur_id, poste_nom, date_absence, motif, statut)
      VALUES (?, ?, DATE('now'), ?, 'Non couvert')
    `).run(operateur_id, posteNom, motif || 'Non spécifié');

    res.json({
      success: true,
      absence_id: Number(info.lastInsertRowid),
      poste_libere: aff ? aff.poste_id : null,
      message: `Absence enregistrée pour l'opérateur #${operateur_id}. Poste ${posteNom} libéré.`
    });
  } catch (err) {
    console.error('Erreur POST /api/absences:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 5. Affecter un opérateur à un poste ─────────────────────────────────────
app.post('/api/affectations', (req, res) => {
  const { poste_id, operateur_id } = req.body;
  if (!poste_id || !operateur_id) {
    return res.status(400).json({ error: 'poste_id et operateur_id sont requis' });
  }

  try {
    // 1. Si l'opérateur était affecté à un autre poste, le libérer
    db.prepare('UPDATE Affectations SET operateur_id = NULL WHERE operateur_id = ?').run(operateur_id);

    // 2. Affecter l'opérateur au poste cible
    const exists = db.prepare('SELECT id FROM Affectations WHERE poste_id = ?').get(poste_id);
    if (exists) {
      db.prepare("UPDATE Affectations SET operateur_id = ?, date_affectation = DATE('now') WHERE poste_id = ?").run(operateur_id, poste_id);
    } else {
      db.prepare('INSERT INTO Affectations (poste_id, operateur_id) VALUES (?, ?)').run(poste_id, operateur_id);
    }

    // 3. Remettre l'opérateur au statut 'present' s'il était absent
    db.prepare("UPDATE Operateurs SET statut = 'present' WHERE id = ?").run(operateur_id);

    // 4. Mettre à jour l'historique des absences pour marquer comme "Couvert" si applicable
    const poste = db.prepare('SELECT nom FROM Postes WHERE id = ?').get(poste_id);
    if (poste) {
      db.prepare("UPDATE Absences SET statut = 'Couvert', remplacant_id = ? WHERE poste_nom = ? AND statut = 'Non couvert'").run(operateur_id, poste.nom);
    }

    res.json({
      success: true,
      poste_id,
      operateur_id,
      message: `Opérateur #${operateur_id} affecté avec succès au poste #${poste_id}.`
    });
  } catch (err) {
    console.error('Erreur POST /api/affectations:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. Algorithme Smart Matching (Candidats éligibles classés) ───────────────
app.get('/api/allocation/remplacants/:posteId', (req, res) => {
  const { posteId } = req.params;

  try {
    const poste = db.prepare('SELECT * FROM Postes WHERE id = ?').get(posteId);
    if (!poste) {
      return res.status(404).json({ error: 'Poste introuvable' });
    }

    // Paramètres de pondération
    const params = db.prepare('SELECT cle, valeur FROM Parametres').all();
    const pMap = {};
    for (const p of params) pMap[p.cle] = p.valeur / 100;
    const wComp = pMap['poids_competence'] || 0.4;
    const wRating = pMap['poids_rating'] || 0.3;
    const wImpact = pMap['poids_impact'] || 0.3;

    // Opérateurs présents
    const operateurs = db.prepare("SELECT * FROM Operateurs WHERE statut = 'present'").all();
    const competences = db.prepare('SELECT * FROM Operateur_Competence').all();
    const certifications = db.prepare('SELECT * FROM Operateur_Certification').all();
    const affectations = db.prepare('SELECT * FROM Affectations').all();

    const compMap = {};
    for (const c of competences) {
      if (!compMap[c.operateur_id]) compMap[c.operateur_id] = {};
      compMap[c.operateur_id][c.competence] = c.niveau;
    }

    const certMap = {};
    for (const c of certifications) {
      if (!certMap[c.operateur_id]) certMap[c.operateur_id] = [];
      certMap[c.operateur_id].push(c.certification);
    }

    const affMap = {};
    for (const a of affectations) {
      if (a.operateur_id) affMap[a.operateur_id] = a.poste_id;
    }

    const lignePoste = db.prepare('SELECT nom FROM Lignes WHERE id = ?').get(poste.ligne_id);

    // Calcul du score SAIOT pour chaque candidat
    const candidats = operateurs
      .filter(op => affMap[op.id] !== Number(posteId)) // Exclure si déjà sur ce poste
      .map(op => {
        const niveauComp = (compMap[op.id] && compMap[op.id][poste.competence]) || 0;
        const certifs = certMap[op.id] || [];

        // Filtre éliminatoire : si certification requise (ex: automate)
        if (poste.competence === 'Automatiste' && !certifs.some(c => c.toLowerCase().includes('barudan'))) {
          // Pénalité importante
        }

        // 1. Compétence (0-100)
        let scoreComp = (niveauComp / 4) * 100;
        if (niveauComp < poste.niveau_requis) scoreComp = Math.max(0, scoreComp - 20);

        // 2. Rating (0-100)
        const scoreRating = (op.rating_global / 5) * 100;

        // 3. Impact Ligne (0-100)
        let scoreImpact = 0;
        const isVolant = !op.ligne_origine || op.ligne_origine.toLowerCase().includes('volant');
        if (isVolant) {
          scoreImpact = 100;
        } else if (lignePoste && op.ligne_origine === lignePoste.nom) {
          scoreImpact = 50;
        } else {
          scoreImpact = 0;
        }

        const scoreSAIOT = Math.round(scoreComp * wComp + scoreRating * wRating + scoreImpact * wImpact);

        return {
          id: op.id,
          matricule: op.matricule,
          nom: op.nom,
          prenom: op.prenom,
          photo: op.photo_url,
          rating: op.rating_global,
          statut: op.statut,
          ligne_origine: op.ligne_origine,
          competences: compMap[op.id] || {},
          certifications: certifs,
          absences_mois: op.absences_mois,
          score_saiot: scoreSAIOT,
          details_score: { scoreComp: Math.round(scoreComp), scoreRating: Math.round(scoreRating), scoreImpact }
        };
      })
      .sort((a, b) => b.score_saiot - a.score_saiot);

    res.json({
      poste: {
        id: poste.id,
        nom: poste.nom,
        ligne_id: poste.ligne_id,
        cadence: poste.cadence,
        competence: poste.competence,
        niveau_requis: poste.niveau_requis,
        est_critique: Boolean(poste.est_critique)
      },
      candidats
    });
  } catch (err) {
    console.error('Erreur GET /api/allocation/remplacants:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 7. Rapports & Indicateurs TRS ───────────────────────────────────────────
app.get('/api/rapports/kpis', (req, res) => {
  try {
    const lignes = db.prepare('SELECT * FROM Lignes').all();
    const postes = db.prepare('SELECT * FROM Postes').all();
    const operateurs = db.prepare('SELECT * FROM Operateurs').all();
    const affectations = db.prepare('SELECT * FROM Affectations WHERE operateur_id IS NOT NULL').all();
    const absencesHistory = db.prepare(`
      SELECT a.*, o.nom, o.prenom 
      FROM Absences a 
      JOIN Operateurs o ON a.operateur_id = o.id 
      ORDER BY a.id DESC LIMIT 10
    `).all();

    const totalProd = lignes.reduce((s, l) => s + l.production, 0);
    const totalObj = lignes.reduce((s, l) => s + l.objectif, 0);
    const oeeGlobal = Math.round(lignes.reduce((s, l) => s + l.efficience, 0) / lignes.length);
    const totalPostes = postes.length;
    const postesCouverts = affectations.length;
    const tauxCouverture = Math.round((postesCouverts / totalPostes) * 100);

    const absents = operateurs.filter(o => o.statut === 'absent').length;
    const tauxAbsenteisme = Math.round((absents / operateurs.length) * 100);

    const historique = absencesHistory.map(a => ({
      date: a.date_absence,
      operateur: `${a.prenom} ${a.nom}`,
      motif: a.motif,
      poste: a.poste_nom,
      statut: a.statut
    }));

    res.json({
      totalProduction: totalProd,
      totalObjectif: totalObj,
      oeeGlobal,
      tauxCouverture,
      postesVacants: totalPostes - postesCouverts,
      totalPostes,
      absents,
      tauxAbsenteisme,
      historique
    });
  } catch (err) {
    console.error('Erreur GET /api/rapports/kpis:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 8. Paramètres de l'Algorithme ────────────────────────────────────────────
app.get('/api/parametres', (req, res) => {
  try {
    const rows = db.prepare('SELECT cle, valeur FROM Parametres').all();
    const result = { competence: 40, rating: 30, impact: 30 };
    for (const r of rows) {
      if (r.cle === 'poids_competence') result.competence = r.valeur;
      if (r.cle === 'poids_rating') result.rating = r.valeur;
      if (r.cle === 'poids_impact') result.impact = r.valeur;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/parametres', (req, res) => {
  const { competence, rating, impact } = req.body;
  try {
    if (competence !== undefined) db.prepare("INSERT OR REPLACE INTO Parametres (cle, valeur) VALUES ('poids_competence', ?)").run(competence);
    if (rating !== undefined) db.prepare("INSERT OR REPLACE INTO Parametres (cle, valeur) VALUES ('poids_rating', ?)").run(rating);
    if (impact !== undefined) db.prepare("INSERT OR REPLACE INTO Parametres (cle, valeur) VALUES ('poids_impact', ?)").run(impact);

    res.json({ success: true, competence, rating, impact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 9. Authentification & Utilisateurs ──────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    const user = db.prepare('SELECT * FROM Users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const { password: _, ...userSafe } = user;
    const token = `saiot-token-${user.id}-${Date.now()}`;
    res.json({ success: true, token, user: userSafe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, nom, prenom, role, role_label, avatar FROM Users ORDER BY id ASC').all();
    const demoMap = {
      'admin@saiot.ma': 'admin123',
      'production@saiot.ma': 'prod123',
      'superviseur@saiot.ma': 'sup123',
      'rh@saiot.ma': 'rh123'
    };
    const enriched = users.map(u => ({ ...u, demoPassword: demoMap[u.email] || '123456' }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, nom, prenom, role, role_label, avatar FROM Users LIMIT 1').get();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 10. Shifts & Roulements d'Équipes ────────────────────────────────────────
app.get('/api/shifts', (req, res) => {
  try {
    const shifts = db.prepare('SELECT * FROM Shifts ORDER BY id ASC').all();
    const nbActifs = shifts.filter(s => s.actif === 1).length;
    res.json({ nombreShiftsActifs: nbActifs, shifts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shifts/config', (req, res) => {
  try {
    const { nombreShifts, shifts } = req.body;
    if (nombreShifts !== undefined) {
      const nb = Math.max(1, Math.min(4, Number(nombreShifts)));
      db.prepare('UPDATE Shifts SET actif = 1 WHERE id <= ?').run(nb);
      db.prepare('UPDATE Shifts SET actif = 0 WHERE id > ?').run(nb);
    }
    if (Array.isArray(shifts)) {
      const updateStmt = db.prepare(`
        UPDATE Shifts SET nom = ?, heures = ?, equipe = ?, objectif = ?, efficience = ?
        WHERE id = ?
      `);
      for (const s of shifts) {
        updateStmt.run(s.nom, s.heures, s.equipe, s.objectif, s.efficience, s.id);
      }
    }
    const updated = db.prepare('SELECT * FROM Shifts ORDER BY id ASC').all();
    const nbActifs = updated.filter(s => s.actif === 1).length;
    res.json({ success: true, nombreShiftsActifs: nbActifs, shifts: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shifts/:shiftId/dashboard', (req, res) => {
  try {
    const shiftId = Number(req.params.shiftId) || 1;
    const shift = db.prepare('SELECT * FROM Shifts WHERE id = ?').get(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift non trouvé' });
    }

    const shiftMetrics = {
      1: {
        id: 1,
        code: 'Matin',
        nom: 'Shift Matin',
        heures: '06:00 - 14:00',
        equipe: 'Équipe Alpha (Matin)',
        objectif: 5500,
        production: 5014,
        efficience: 91,
        postesVacants: 2,
        absents: 1,
        absentNames: ['Omar Tahiri (Fermeture Côtés - L3)'],
        lignesStatus: [
          { id: 1, nom: 'Ligne 1 - Pantalons Chino (Montage)', efficience: 94, production: 1692, objectif: 1800, vacants: 1 },
          { id: 2, nom: 'Ligne 2 - Polos Piqué (Finition)', efficience: 88, production: 1320, objectif: 1500, vacants: 1 },
          { id: 3, nom: 'Ligne 3 - T-Shirts Jersey (Assemblage)', efficience: 91, production: 2002, objectif: 2200, vacants: 0 }
        ]
      },
      2: {
        id: 2,
        code: 'ApresMidi',
        nom: 'Shift Après-Midi',
        heures: '14:00 - 22:00',
        equipe: 'Équipe Bravo (Après-Midi)',
        objectif: 4800,
        production: 4210,
        efficience: 88,
        postesVacants: 3,
        absents: 2,
        absentNames: ['Youssef El Fassi (Ourlage - L1)', 'Laila Mansour (Pose Manches - L3)'],
        lignesStatus: [
          { id: 1, nom: 'Ligne 1 - Pantalons Chino (Montage)', efficience: 89, production: 1580, objectif: 1800, vacants: 1 },
          { id: 2, nom: 'Ligne 2 - Polos Piqué (Finition)', efficience: 86, production: 1220, objectif: 1500, vacants: 1 },
          { id: 3, nom: 'Ligne 3 - T-Shirts Jersey (Assemblage)', efficience: 89, production: 1410, objectif: 1500, vacants: 1 }
        ]
      },
      3: {
        id: 3,
        code: 'Nuit',
        nom: 'Shift Nuit',
        heures: '22:00 - 06:00',
        equipe: 'Équipe Charlie (Nuit)',
        objectif: 3200,
        production: 2950,
        efficience: 92,
        postesVacants: 1,
        absents: 0,
        absentNames: [],
        lignesStatus: [
          { id: 1, nom: 'Ligne 1 - Pantalons Chino (Montage)', efficience: 93, production: 1100, objectif: 1200, vacants: 0 },
          { id: 2, nom: 'Ligne 2 - Polos Piqué (Finition)', efficience: 90, production: 950, objectif: 1000, vacants: 1 },
          { id: 3, nom: 'Ligne 3 - T-Shirts Jersey (Assemblage)', efficience: 93, production: 900, objectif: 1000, vacants: 0 }
        ]
      },
      4: {
        id: 4,
        code: 'Weekend',
        nom: 'Shift Weekend & Relève',
        heures: '06:00 - 18:00',
        equipe: 'Équipe Delta (Relève)',
        objectif: 2500,
        production: 2320,
        efficience: 93,
        postesVacants: 1,
        absents: 0,
        absentNames: [],
        lignesStatus: [
          { id: 1, nom: 'Ligne 1 - Pantalons Chino (Montage)', efficience: 94, production: 950, objectif: 1000, vacants: 0 },
          { id: 2, nom: 'Ligne 2 - Polos Piqué (Finition)', efficience: 92, production: 720, objectif: 750, vacants: 1 },
          { id: 3, nom: 'Ligne 3 - T-Shirts Jersey (Assemblage)', efficience: 93, production: 650, objectif: 750, vacants: 0 }
        ]
      }
    };

    res.json(shiftMetrics[shiftId] || shiftMetrics[1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Démarrage Serveur ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 [SAIOT-API] Serveur Express actif sur http://localhost:${PORT}`);
  console.log(`📋 [SAIOT-API] Endpoints disponibles :`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/lignes`);
  console.log(`   - GET  /api/operateurs`);
  console.log(`   - POST /api/absences`);
  console.log(`   - POST /api/affectations`);
  console.log(`   - GET  /api/allocation/remplacants/:posteId`);
  console.log(`   - GET  /api/rapports/kpis`);
  console.log(`   - GET  /api/parametres`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/users`);
  console.log(`   - GET  /api/shifts`);
  console.log(`   - POST /api/shifts/config\n`);
});
