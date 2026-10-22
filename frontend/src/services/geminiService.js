/**
 * geminiService.js
 * Service d'intégration Gemini AI pour l'analyse d'allocation des opérateurs.
 * Utilise le SDK @google/genai avec streaming.
 */
import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Niveaux de compétence textuels
const NIVEAUX = { 0: 'Non formé', 1: 'Débutant', 2: 'En cours d\'apprentissage', 3: 'Autonome', 4: 'Expert' };

/**
 * Calcule le temps d'adaptation estimé (en minutes) pour un opérateur sur un poste.
 * Basé sur l'écart entre le niveau actuel et le niveau requis, pondéré par le rating.
 */
export function calculerTempsAdaptation(operateur, poste) {
  const niveauOp = operateur.competences?.[poste.competence] || 0;
  const niveauReq = poste.niveau_requis || 1;
  const ecart = niveauReq - niveauOp;
  const ratingFactor = 1 - ((operateur.rating - 3) / 10); // rating élevé = apprentissage plus rapide

  if (ecart <= 0) {
    // Opérateur qualifié ou sur-qualifié
    const isVolant = !operateur.ligne_origine || operateur.ligne_origine.toLowerCase().includes('volant');
    return isVolant ? 0 : 5; // Volant = immédiat, sinon 5 min déplacement
  }

  const tempBase = {
    1: 15,  // -1 niveau : 15 min
    2: 40,  // -2 niveaux : 40 min
    3: 90,  // -3 niveaux : 90 min
    4: 180  // -4 niveaux : 3h
  };

  const temps = Math.round((tempBase[Math.min(ecart, 4)] || 180) * ratingFactor);
  return temps;
}

/**
 * Calcule le temps de production perdu (en minutes) pour atteindre la cadence cible.
 * Ramping = montée en cadence progressive sur la base du niveau.
 */
export function calculerRampingTime(operateur, poste) {
  const niveauOp = operateur.competences?.[poste.competence] || 0;
  const niveauReq = poste.niveau_requis || 1;
  const ecart = niveauReq - niveauOp;

  if (ecart <= 0) return { duree: 15, efficienceInitiale: 90 }; // 90% immédiatement
  if (ecart === 1) return { duree: 30, efficienceInitiale: 70 };
  if (ecart === 2) return { duree: 60, efficienceInitiale: 50 };
  return { duree: 120, efficienceInitiale: 30 };
}

/**
 * Détermine la recommandation d'arrêt de ligne.
 */
export function analyserArretLigne(poste, candidatOpt, tempsAdaptation) {
  const bufferDisponible = poste.est_critique ? 20 : 60; // min de stock tampon estimé
  const perteProd = Math.round((poste.cadence * tempsAdaptation) / 60);

  if (poste.est_critique && tempsAdaptation > bufferDisponible) {
    return {
      recommendation: 'ARRÊT_URGENT',
      label: 'Arrêt Ligne Recommandé',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      icon: '🛑',
      raison: `Poste goulot critique. Le temps d'adaptation (${tempsAdaptation} min) dépasse le buffer disponible (${bufferDisponible} min). L'arrêt contrôlé évite les défauts qualité.`,
      perteProd
    };
  }

  if (tempsAdaptation > 45) {
    return {
      recommendation: 'MODE_DÉGRADÉ',
      label: 'Mode Dégradé Possible',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      icon: '⚠️',
      raison: `Poste peut continuer à cadence réduite (~${candidatOpt ? Math.round((candidatOpt.competences?.[poste.competence] || 1) / poste.niveau_requis * poste.cadence) : 'N/A'} p/h) pendant la montée en régime.`,
      perteProd
    };
  }

  return {
    recommendation: 'CONTINUITÉ',
    label: 'Continuité de Production',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    icon: '✅',
    raison: `Transition rapide sans interruption. L'opérateur sera opérationnel en ${tempsAdaptation} min.`,
    perteProd
  };
}

/**
 * Construit le prompt enrichi pour Gemini avec tout le contexte SAIOT.
 */
function construirePrompt(poste, candidats, contexteUsine) {
  const candidatsText = candidats.map((c, i) => {
    const niveauOp = c.competences?.[poste.competence] || 0;
    const tempsAdapt = calculerTempsAdaptation(c, poste);
    const ramping = calculerRampingTime(c, poste);
    const isVolant = !c.ligne_origine || c.ligne_origine.toLowerCase().includes('volant');
    const impactLigne = isVolant ? 'Aucun impact (opérateur volant)' : `Absence sur ${c.ligne_origine} — risque de goulot secondaire`;

    return `
Candidat #${i + 1}: ${c.prenom || ''} ${c.nom}
  - Matricule: ${c.matricule || 'N/A'}
  - Ligne actuelle: ${c.ligne_origine}
  - Rating global: ${c.rating}/5
  - Score SAIOT calculé: ${c.score_saiot || 'N/A'}/100
  - Niveau ${poste.competence}: ${niveauOp}/4 (${NIVEAUX[niveauOp]})
  - Niveau requis: ${poste.niveau_requis}/4 (${NIVEAUX[poste.niveau_requis]})
  - Certifications: ${c.certifications?.join(', ') || 'Aucune'}
  - Absences ce mois: ${c.absences_mois || 0} jour(s)
  - Temps d'adaptation estimé: ${tempsAdapt} minutes
  - Efficience initiale estimée: ${ramping.efficienceInitiale}% → 100% en ${ramping.duree} min
  - Impact sur sa ligne d'origine: ${impactLigne}`;
  }).join('\n');

  return `Tu es SAIOT-AI, un système expert en gestion des ressources humaines dans une usine de confection textile.
Tu dois analyser une situation d'absence et recommander le meilleur remplacement avec une analyse précise des impacts sur la production.

=== CONTEXTE DE L'USINE ===
Shift actuel: Matin (06:00–14:00)
OEE global actuel: ${contexteUsine.oeeGlobal}%
Heure actuelle dans le shift: environ 2h après le démarrage
Postes vacants simultanés: ${contexteUsine.postesVacants}

=== POSTE À COUVRIR ===
- Nom du poste: ${poste.nom}
- Ligne de production: ${contexteUsine.nomLigne || 'Ligne concernée'}
- Cadence standard: ${poste.cadence} pièces/heure
- Compétence requise: ${poste.competence} (Niveau ${poste.niveau_requis}/4 — ${NIVEAUX[poste.niveau_requis]})
- Poste goulot (critique): ${poste.est_critique ? 'OUI — Tout arrêt impacte la ligne entière' : 'NON — Peut fonctionner en mode dégradé'}
- Stock tampon estimé: ${poste.est_critique ? '~20 min' : '~60 min'}

=== CANDIDATS DISPONIBLES ===
${candidatsText}

=== INSTRUCTIONS D'ANALYSE ===
Pour CHAQUE candidat, fournis une analyse structurée avec:

1. **DÉCISION D'ARRÊT DE LIGNE** : Doit-on arrêter la ligne ? Combien de temps ?
2. **TEMPS DE PRISE EN MAIN** : Durée précise avant productivité normale, avec courbe de montée en régime
3. **PERTE DE PRODUCTION ESTIMÉE** : En pièces et en pourcentage de l'objectif journalier
4. **RISQUES QUALITÉ** : Y a-t-il un risque de défauts sur les pièces pendant la montée en régime ?
5. **IMPACT SUR SA LIGNE D'ORIGINE** : Que se passe-t-il sur la ligne qu'il quitte ?
6. **RECOMMANDATION FINALE** : Choisir ce candidat OUI/NON et pourquoi en 1 phrase directe

Réponds en FRANÇAIS. Sois précis, chiffré, et concis. Format: analyse structurée par candidat avec titres clairs.
Termine par une RECOMMANDATION GLOBALE sur quel candidat choisir et si la ligne doit être arrêtée ou non.`;
}

/**
 * Appel principal à Gemini avec streaming pour l'analyse IA d'allocation.
 * @param {Object} poste - Le poste vacant
 * @param {Array} candidats - Liste des candidats enrichis
 * @param {Object} contexteUsine - OEE, postes vacants, etc.
 * @param {Function} onChunk - Callback appelé à chaque morceau de texte reçu
 * @param {Function} onDone - Callback appelé quand l'analyse est terminée
 * @param {Function} onError - Callback d'erreur
 */
export async function analyserAvecGemini(poste, candidats, contexteUsine, onChunk, onDone, onError) {
  if (!API_KEY || API_KEY === 'VOTRE_CLE_API_ICI') {
    onError('⚠️ Clé API Gemini manquante. Ajoutez VITE_GEMINI_API_KEY dans le fichier .env du frontend.');
    return;
  }

  const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastErr = null;

  for (const model of MODELS) {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const prompt = construirePrompt(poste, candidats, contexteUsine);

      const result = await ai.models.generateContentStream({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.3,          // Précision industrielle
          maxOutputTokens: 8192,      // Budget large pour éviter toute coupure
          topP: 0.8,
        }
      });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) onChunk(text);
      }

      onDone();
      return; // Succès !
    } catch (err) {
      console.warn(`[SAIOT-AI] Échec avec le modèle ${model}, tentative suivante...`, err);
      lastErr = err;
    }
  }

  console.error('[SAIOT-AI] Gemini all models error:', lastErr);
  onError(`Erreur Gemini: ${lastErr?.message || 'Connexion impossible. Vérifiez votre clé API.'}`);
}
