/**
 * apiService.js
 * Service d'appels API vers le backend SAIOT (Node.js/Express + SQLite).
 * Fournit une synchronisation temps réel avec repli automatique (fallback).
 */

const API_BASE = '/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getLignesFromAPI() {
  const res = await fetch(`${API_BASE}/lignes`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOperateursFromAPI() {
  const res = await fetch(`${API_BASE}/operateurs`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function postAbsenceToAPI(operateurId, motif) {
  const res = await fetch(`${API_BASE}/absences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operateur_id: operateurId, motif })
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function postAffectationToAPI(posteId, operateurId) {
  const res = await fetch(`${API_BASE}/affectations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poste_id: posteId, operateur_id: operateurId })
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getRapportsFromAPI() {
  const res = await fetch(`${API_BASE}/rapports/kpis`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getParametresFromAPI() {
  const res = await fetch(`${API_BASE}/parametres`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function updateParametresInAPI(weights) {
  const res = await fetch(`${API_BASE}/parametres`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(weights)
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

// ── Authentification ──────────────────────────────────────────────────────────
export async function loginAPI(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
  return data;
}

export async function getAuthUsersAPI() {
  const res = await fetch(`${API_BASE}/auth/users`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

// ── Shifts ────────────────────────────────────────────────────────────────────
export async function getShiftsAPI() {
  const res = await fetch(`${API_BASE}/shifts`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveShiftConfigAPI(nombreShifts, shifts) {
  const res = await fetch(`${API_BASE}/shifts/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreShifts, shifts })
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getShiftDashboardAPI(shiftId) {
  const res = await fetch(`${API_BASE}/shifts/${shiftId}/dashboard`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

