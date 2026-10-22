/**
 * allocationService.js
 * 
 * Ce service gère la logique métier de l'allocation et de la recommandation 
 * des opérateurs en cas d'absence.
 */

// Poids des critères pour le scoring de remplacement
const WEIGHTS = {
    COMPETENCE_LEVEL: 0.4,   // Poids du niveau de compétence
    GLOBAL_RATING: 0.3,      // Poids du rating global de l'opérateur
    IMPACT_LIGNE: 0.3        // Poids de l'impact sur sa ligne d'origine
};

/**
 * Calcule le score de compatibilité d'un opérateur pour un poste donné.
 * @param {Object} operateur - Données de l'opérateur.
 * @param {Object} poste - Données du poste à pourvoir.
 * @returns {Number|null} - Le score (0-100) ou null si éliminé (certification invalide).
 */
function calculerScoreRemplacement(operateur, poste) {
    // 1. CRITÈRE ÉLIMINATOIRE : Validation de la certification
    if (poste.certification_requise_id) {
        const certif = operateur.certifications.find(c => c.id === poste.certification_requise_id);
        const aujourdhui = new Date();
        
        // L'opérateur est disqualifié s'il n'a pas la certification ou si elle est expirée
        if (!certif || new Date(certif.date_validite) < aujourdhui) {
            return null; // Éliminatoire
        }
    }

    let score = 0;

    // 2. CORRESPONDANCE DES COMPÉTENCES (Niveau 1 à 4)
    let niveauCompetence = 0;
    if (poste.competence_requise_id) {
        const comp = operateur.competences.find(c => c.id === poste.competence_requise_id);
        niveauCompetence = comp ? comp.niveau : 0;
        
        // Mode dégradé : si l'opérateur est sous-qualifié, on le pénalise fortement mais on ne l'élimine pas
        if (niveauCompetence < poste.niveau_requis) {
            score -= 20; // Pénalité
        }
    }
    // Normalisation de la compétence sur 100 (niveau max = 4)
    const scoreCompetence = (niveauCompetence / 4) * 100;

    // 3. RATING DE PERFORMANCE GLOBALE (Rating sur 5)
    // Normalisation sur 100
    const scoreRating = (operateur.rating_global / 5) * 100;

    // 4. IMPACT SUR LA LIGNE (Disponibilité / "Volant")
    let scoreImpact = 0;
    if (!operateur.affectation_actuelle) {
        // L'opérateur n'est affecté à aucun poste aujourd'hui (disponible à 100%)
        scoreImpact = 100;
    } else if (operateur.ligne_origine_id === poste.ligne_id) {
        // L'opérateur est sur la même ligne (déplacement moins perturbant)
        scoreImpact = 50;
    } else {
        // L'opérateur vient d'une autre ligne (impact fort sur la production globale)
        scoreImpact = 0;
    }

    // 5. Calcul du score final pondéré
    score += (scoreCompetence * WEIGHTS.COMPETENCE_LEVEL) +
             (scoreRating * WEIGHTS.GLOBAL_RATING) +
             (scoreImpact * WEIGHTS.IMPACT_LIGNE);

    return Math.max(0, Math.round(score)); // Score final entre 0 et 100
}

/**
 * Trouve les meilleurs remplaçants pour un poste.
 * @param {Object} poste - Le poste ciblé.
 * @param {Array} operateursDisponibles - Liste des opérateurs présents ce jour-là.
 * @returns {Array} - Liste triée des remplaçants suggérés avec leur score.
 */
function trouverRemplacants(poste, operateursDisponibles) {
    const recommandations = [];

    for (const op of operateursDisponibles) {
        const score = calculerScoreRemplacement(op, poste);
        
        if (score !== null) {
            recommandations.push({
                operateur: op,
                score: score,
                // Ajout de métadonnées pour UI (facilite la prise de décision du chef d'atelier)
                matchPerfect: score >= 80,
                warning: score < 50 ? "Sous-qualifié ou impact élevé sur la production" : null
            });
        }
    }

    // Trier du meilleur score au moins bon
    return recommandations.sort((a, b) => b.score - a.score);
}

module.exports = {
    trouverRemplacants,
    calculerScoreRemplacement
};
