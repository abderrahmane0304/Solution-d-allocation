import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, Factory, Settings, Bell, Clock,
  AlertTriangle, UserMinus, Star, TrendingUp, Cpu,
  Bot, Sparkles, Check, X, Plus, Edit2, Trash2,
  ShieldCheck, Award, ChevronDown, ChevronRight,
  BarChart2, PieChart, Activity, RefreshCw, Save,
  UserCheck, UserX, CalendarOff, Zap, Target, ArrowUpRight,
  AlertCircle, CheckCircle2, Search, Filter, Download, Eye,
  Timer, Gauge, OctagonX, PlayCircle, Loader2,
  Lock, Mail, LogIn, LogOut, EyeOff, Layers, Sun, Moon
} from 'lucide-react';
import './index.css';
import {
  analyserAvecGemini,
  calculerTempsAdaptation,
  calculerRampingTime,
  analyserArretLigne
} from './services/geminiService';
import {
  checkBackendHealth,
  getLignesFromAPI,
  getOperateursFromAPI,
  postAbsenceToAPI,
  postAffectationToAPI,
  getParametresFromAPI,
  updateParametresInAPI,
  loginAPI,
  getAuthUsersAPI,
  getShiftsAPI,
  saveShiftConfigAPI,
  getShiftDashboardAPI
} from './services/apiService';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const mockLignes = [
  {
    id: 1, nom: 'Ligne 1 - Pantalons Chino (Montage)', efficience: 94, objectif: 1800, production: 1692,
    postes: [
      { id: 101, nom: 'Surjeteuse 5 fils (Côtés)', est_critique: false, cadence: 120, competence: 'Surjeteuse', niveau_requis: 2, operateur: { id: 1, nom: 'Ali Benali', photo: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 4.8, statut: 'present' } },
      { id: 102, nom: 'Automate Pose Poche', est_critique: true, cadence: 180, competence: 'Automatiste', niveau_requis: 4, operateur: null },
      { id: 103, nom: 'Piqueuse Plate (Braguette)', est_critique: true, cadence: 90, competence: 'Piqueuse Plate', niveau_requis: 3, operateur: { id: 3, nom: 'Sarah Leroy', photo: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 4.9, statut: 'present' } },
      { id: 104, nom: 'Ourlage Bas', est_critique: false, cadence: 150, competence: 'Ourlage', niveau_requis: 2, operateur: { id: 4, nom: 'Youssef El Fassi', photo: 'https://randomuser.me/api/portraits/men/46.jpg', rating: 3.9, statut: 'present' } },
    ]
  },
  {
    id: 2, nom: 'Ligne 2 - Polos Piqué (Finition)', efficience: 88, objectif: 1500, production: 1320,
    postes: [
      { id: 201, nom: 'Pose Col (Surjeteuse)', est_critique: true, cadence: 140, competence: 'Surjeteuse', niveau_requis: 3, operateur: { id: 5, nom: 'Marie Durand', photo: 'https://randomuser.me/api/portraits/women/12.jpg', rating: 4.5, statut: 'present' } },
      { id: 202, nom: 'Plaquage Patte Boutonnage', est_critique: true, cadence: 110, competence: 'Piqueuse Plate', niveau_requis: 3, operateur: { id: 6, nom: 'Karim Ziani', photo: 'https://randomuser.me/api/portraits/men/75.jpg', rating: 4.7, statut: 'present' } },
      { id: 203, nom: 'Contrôle Qualité Final', est_critique: false, cadence: 200, competence: 'Contrôle Qualité', niveau_requis: 2, operateur: null },
    ]
  },
  {
    id: 3, nom: 'Ligne 3 - T-Shirts Jersey (Assemblage)', efficience: 91, objectif: 2200, production: 2002,
    postes: [
      { id: 301, nom: 'Assemblage Épaules', est_critique: false, cadence: 160, competence: 'Surjeteuse', niveau_requis: 2, operateur: { id: 7, nom: 'Amine Berrada', photo: 'https://randomuser.me/api/portraits/men/22.jpg', rating: 4.5, statut: 'present' } },
      { id: 302, nom: 'Pose Manches', est_critique: true, cadence: 130, competence: 'Surjeteuse', niveau_requis: 3, operateur: { id: 8, nom: 'Laila Mansour', photo: 'https://randomuser.me/api/portraits/women/26.jpg', rating: 4.2, statut: 'present' } },
      { id: 303, nom: 'Fermeture Côtés', est_critique: false, cadence: 150, competence: 'Surjeteuse', niveau_requis: 2, operateur: { id: 9, nom: 'Omar Tahiri', photo: 'https://randomuser.me/api/portraits/men/86.jpg', rating: 3.7, statut: 'present' } },
    ]
  }
];

const mockOperateurs = [
  { id: 1, matricule: 'OP-001', nom: 'Benali', prenom: 'Ali', photo: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 4.8, statut: 'present', ligne_origine: 'Ligne 1', competences: { 'Surjeteuse': 4, 'Piqueuse Plate': 3, 'Ourlage': 2 }, certifications: ['Automate Barudan', 'Coupe Gerber'], absences_mois: 0 },
  { id: 2, matricule: 'OP-002', nom: 'Zahra', prenom: 'Fatima', photo: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 4.9, statut: 'present', ligne_origine: 'Volante', competences: { 'Automatiste': 4, 'Surjeteuse': 4, 'Piqueuse Plate': 4, 'Ourlage': 3 }, certifications: ['Automate Barudan', 'Coupe Gerber', 'Thermocollage'], absences_mois: 0 },
  { id: 3, matricule: 'OP-003', nom: 'Leroy', prenom: 'Sarah', photo: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 4.9, statut: 'present', ligne_origine: 'Ligne 1', competences: { 'Piqueuse Plate': 4, 'Surjeteuse': 3, 'Ourlage': 2 }, certifications: ['Automate Barudan'], absences_mois: 1 },
  { id: 4, matricule: 'OP-004', nom: 'El Fassi', prenom: 'Youssef', photo: 'https://randomuser.me/api/portraits/men/46.jpg', rating: 3.9, statut: 'present', ligne_origine: 'Ligne 1', competences: { 'Ourlage': 3, 'Surjeteuse': 2 }, certifications: [], absences_mois: 2 },
  { id: 5, matricule: 'OP-005', nom: 'Durand', prenom: 'Marie', photo: 'https://randomuser.me/api/portraits/women/12.jpg', rating: 4.5, statut: 'present', ligne_origine: 'Ligne 2', competences: { 'Surjeteuse': 4, 'Piqueuse Plate': 2, 'Contrôle Qualité': 3 }, certifications: ['Thermocollage'], absences_mois: 1 },
  { id: 6, matricule: 'OP-006', nom: 'Ziani', prenom: 'Karim', photo: 'https://randomuser.me/api/portraits/men/75.jpg', rating: 4.7, statut: 'present', ligne_origine: 'Ligne 2', competences: { 'Piqueuse Plate': 4, 'Surjeteuse': 3 }, certifications: ['Coupe Gerber'], absences_mois: 0 },
  { id: 7, matricule: 'OP-007', nom: 'Berrada', prenom: 'Amine', photo: 'https://randomuser.me/api/portraits/men/22.jpg', rating: 4.5, statut: 'present', ligne_origine: 'Ligne 3', competences: { 'Surjeteuse': 3, 'Ourlage': 2 }, certifications: [], absences_mois: 1 },
  { id: 8, matricule: 'OP-008', nom: 'Mansour', prenom: 'Laila', photo: 'https://randomuser.me/api/portraits/women/26.jpg', rating: 4.2, statut: 'present', ligne_origine: 'Ligne 3', competences: { 'Surjeteuse': 3, 'Contrôle Qualité': 2 }, certifications: [], absences_mois: 3 },
  { id: 9, matricule: 'OP-009', nom: 'Tahiri', prenom: 'Omar', photo: 'https://randomuser.me/api/portraits/men/86.jpg', rating: 3.7, statut: 'absent', ligne_origine: 'Ligne 3', competences: { 'Surjeteuse': 2 }, certifications: [], absences_mois: 4 },
  { id: 10, matricule: 'OP-010', nom: 'Lami', prenom: 'Nadia', photo: 'https://randomuser.me/api/portraits/women/50.jpg', rating: 3.8, statut: 'present', ligne_origine: 'Volante', competences: { 'Automatiste': 2, 'Piqueuse Plate': 3, 'Surjeteuse': 3, 'Ourlage': 3 }, certifications: ['Automate Barudan'], absences_mois: 2 },
];

// Candidats remplaçants enrichis avec données pour Gemini
// Ils seront croisés avec mockOperateurs dans le composant
const CANDIDATS_POSTE_102 = [2, 10, 5]; // IDs des candidats pour l'Automate Pose Poche (Ligne 1)

const COMPETENCES_LIST = ['Surjeteuse', 'Piqueuse Plate', 'Ourlage', 'Automatiste', 'Contrôle Qualité', 'Coupe', 'Thermocollage'];
const NIVEAUX_LABELS = ['', 'Débutant', 'En cours', 'Autonome', 'Expert'];

const mockAbsencesHistory = [
  { date: '2026-10-18', operateur: 'Omar Tahiri', motif: 'Maladie', poste: 'Fermeture Côtés', statut: 'Non couvert' },
  { date: '2026-10-17', operateur: 'Ali Benali', motif: 'Congé', poste: 'Surjeteuse 5 fils', statut: 'Couvert' },
  { date: '2026-10-16', operateur: 'Nadia Lami', motif: 'Absence injustifiée', poste: 'Volante', statut: 'Couvert' },
  { date: '2026-10-15', operateur: 'Marie Durand', motif: 'RDV médical', poste: 'Pose Col', statut: 'Couvert' },
  { date: '2026-10-14', operateur: 'Youssef El Fassi', motif: 'Maladie', poste: 'Ourlage Bas', statut: 'Couvert' },
];

// ─── COMPTES DÉMO & AUTHENTIFICATION ──────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    id: 1,
    email: 'admin@saiot.ma',
    password: 'admin123',
    nom: 'Benkirane',
    prenom: 'Rachid',
    role: 'admin',
    role_label: "Chef d'Atelier (Admin)",
    avatar: 'https://randomuser.me/api/portraits/men/51.jpg',
    description: 'Accès complet : allocation IA, paramétrages & shifts'
  },
  {
    id: 2,
    email: 'production@saiot.ma',
    password: 'prod123',
    nom: 'Tazi',
    prenom: 'Leila',
    role: 'production',
    role_label: 'Directrice Production',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    description: 'Supervision globale TRS, objectifs usine & consultation multi-shifts'
  },
  {
    id: 3,
    email: 'superviseur@saiot.ma',
    password: 'sup123',
    nom: 'Chraibi',
    prenom: 'Tariq',
    role: 'superviseur',
    role_label: 'Superviseur Lignes',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    description: 'Gestion atelier, affectations directes & déclarations d’aléas'
  },
  {
    id: 4,
    email: 'rh@saiot.ma',
    password: 'rh123',
    nom: 'Alaoui',
    prenom: 'Salma',
    role: 'rh',
    role_label: 'Responsable RH & Compétences',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    description: 'Matrice polyvalence, suivi certifications & gestion absences'
  }
];

// ─── SHIFTS USINE (ROULEMENTS D'ÉQUIPES) ──────────────────────────────────────
const DEFAULT_SHIFTS = [
  { id: 1, code: 'Matin', nom: 'Shift Matin', heures: '06:00 - 14:00', equipe: 'Équipe Alpha (Matin)', objectif: 5500, production: 5014, efficience: 91, actif: 1, icon: '🌅' },
  { id: 2, code: 'ApresMidi', nom: 'Shift Après-Midi', heures: '14:00 - 22:00', equipe: 'Équipe Bravo (Après-Midi)', objectif: 4800, production: 4210, efficience: 88, actif: 1, icon: '☀️' },
  { id: 3, code: 'Nuit', nom: 'Shift Nuit', heures: '22:00 - 06:00', equipe: 'Équipe Charlie (Nuit)', objectif: 3200, production: 2950, efficience: 92, actif: 1, icon: '🌙' },
  { id: 4, code: 'Weekend', nom: 'Shift Weekend & Relève', heures: '06:00 - 18:00', equipe: 'Équipe Delta (Relève)', objectif: 2500, production: 2320, efficience: 93, actif: 0, icon: '⚡' },
];

// ─── COMPOSANT : PAGE DE CONNEXION (LOGIN) ────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e, directEmail, directPassword) => {
    if (e) e.preventDefault();
    const loginEmail = directEmail || email;
    const loginPass = directPassword || password;

    if (!loginEmail || !loginPass) {
      setError('Veuillez renseigner un email et un mot de passe.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginAPI(loginEmail, loginPass);
      if (res && res.user) {
        onLogin(res.user);
        return;
      }
    } catch {
      const found = DEMO_ACCOUNTS.find(
        u => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPass
      );
      if (found) {
        onLogin(found);
        return;
      }
      setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe ou cliquer sur un accès rapide ci-dessous.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    handleSubmit(null, acc.email, acc.password);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* En-tête */}
        <div className="login-header">
          <div className="login-logo-glow">
            <Cpu size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'white', marginBottom: '0.4rem' }}>
            SAIOT Textile
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Système d'Allocation Intelligent des Opérateurs Textiles
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', padding: '3px 12px', borderRadius: '99px', fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
            <Sparkles size={12} /> Version 1.2 · Authentification & Multi-Shifts
          </div>
        </div>

        {/* Alerte d'erreur */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Email professionnel
            </label>
            <input
              type="email"
              className="form-select"
              placeholder="ex: admin@saiot.ma"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ background: 'rgba(15, 23, 42, 0.7)' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-select"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem', background: 'rgba(15, 23, 42, 0.7)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, var(--accent-indigo), #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)', transition: '0.2s' }}
          >
            {loading
              ? <span key="loading" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Authentification...</span>
              : <span key="idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><LogIn size={18} /> Se connecter à l'Atelier</span>}
          </button>
        </form>

        {/* Accès Démo Rapide */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
              ⚡ Accès Rapides & Comptes Démo
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>Cliquez pour entrer</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <div
                key={acc.id}
                className="demo-account-chip"
                onClick={() => handleQuickLogin(acc)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img src={acc.avatar} alt={acc.nom} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.4)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {acc.prenom} {acc.nom} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>({acc.role_label})</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      🔑 {acc.email} · <span style={{ fontFamily: 'monospace', color: 'var(--accent-indigo)' }}>{acc.password}</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  1-Clic ➔
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANT : MODAL CONFIGURATION DU NOMBRE DE SHIFTS ───────────────────────
const ShiftConfigModal = ({ onClose, shifts, nombreShifts, onSaveConfig }) => {
  const [selectedNb, setSelectedNb] = useState(nombreShifts);
  const [localShifts, setLocalShifts] = useState(shifts);
  const [saved, setSaved] = useState(false);

  const shiftPresets = {
    1: [
      { id: 1, code: 'Journee', nom: 'Journée Normale', heures: '08:00 - 17:00', equipe: 'Équipe Unique (Jour)', objectif: 5000, production: 4600, efficience: 92, actif: 1, icon: '☀️' }
    ],
    2: [
      { id: 1, code: 'Matin', nom: 'Shift 1 — Matin', heures: '06:00 - 14:00', equipe: 'Équipe Alpha (Matin)', objectif: 5500, production: 5014, efficience: 91, actif: 1, icon: '🌅' },
      { id: 2, code: 'ApresMidi', nom: 'Shift 2 — Après-Midi', heures: '14:00 - 22:00', equipe: 'Équipe Bravo (Après-Midi)', objectif: 4800, production: 4210, efficience: 88, actif: 1, icon: '☀️' }
    ],
    3: [
      { id: 1, code: 'Matin', nom: 'Shift 1 — Matin', heures: '06:00 - 14:00', equipe: 'Équipe Alpha (Matin)', objectif: 5500, production: 5014, efficience: 91, actif: 1, icon: '🌅' },
      { id: 2, code: 'ApresMidi', nom: 'Shift 2 — Après-Midi', heures: '14:00 - 22:00', equipe: 'Équipe Bravo (Après-Midi)', objectif: 4800, production: 4210, efficience: 88, actif: 1, icon: '☀️' },
      { id: 3, code: 'Nuit', nom: 'Shift 3 — Nuit', heures: '22:00 - 06:00', equipe: 'Équipe Charlie (Nuit)', objectif: 3200, production: 2950, efficience: 92, actif: 1, icon: '🌙' }
    ],
    4: [
      { id: 1, code: 'Matin', nom: 'Shift 1 — Matin', heures: '06:00 - 14:00', equipe: 'Équipe Alpha (Matin)', objectif: 5500, production: 5014, efficience: 91, actif: 1, icon: '🌅' },
      { id: 2, code: 'ApresMidi', nom: 'Shift 2 — Après-Midi', heures: '14:00 - 22:00', equipe: 'Équipe Bravo (Après-Midi)', objectif: 4800, production: 4210, efficience: 88, actif: 1, icon: '☀️' },
      { id: 3, code: 'Nuit', nom: 'Shift 3 — Nuit', heures: '22:00 - 06:00', equipe: 'Équipe Charlie (Nuit)', objectif: 3200, production: 2950, efficience: 92, actif: 1, icon: '🌙' },
      { id: 4, code: 'Weekend', nom: 'Shift 4 — Relève & WE', heures: '06:00 - 18:00', equipe: 'Équipe Delta (Relève)', objectif: 2500, production: 2320, efficience: 93, actif: 1, icon: '⚡' }
    ]
  };

  const handleSelectPreset = (nb) => {
    setSelectedNb(nb);
    const preset = shiftPresets[nb] || shiftPresets[3];
    setLocalShifts(preset);
  };

  const handleSave = () => {
    setSaved(true);
    onSaveConfig(selectedNb, localShifts);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.15)', padding: '0.6rem', borderRadius: '50%' }}>
              <Clock size={22} color="var(--accent-indigo)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Configuration des Shifts Usine</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Définissez combien de shifts composent la journée de production
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
              1. Choisissez le nombre de shifts par jour
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
              {[
                { nb: 1, label: '1 Shift', sub: 'Journée normale (8h)' },
                { nb: 2, label: '2 Shifts (2x8)', sub: 'Matin & Soir' },
                { nb: 3, label: '3 Shifts (3x8)', sub: 'Continu 24h/24' },
                { nb: 4, label: '4 Shifts (4x8)', sub: 'Continu + WE' }
              ].map(item => (
                <button
                  key={item.nb}
                  type="button"
                  onClick={() => handleSelectPreset(item.nb)}
                  style={{
                    padding: '0.8rem 0.5rem',
                    borderRadius: '10px',
                    border: `2px solid ${selectedNb === item.nb ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                    background: selectedNb === item.nb ? 'rgba(99,102,241,0.15)' : 'var(--bg-base)',
                    color: selectedNb === item.nb ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.label}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
              2. Détail des équipes ({localShifts.length} {localShifts.length > 1 ? 'shifts actifs' : 'shift actif'})
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {localShifts.map((s, idx) => (
                <div
                  key={s.id || idx}
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.4rem' }}>{s.icon || '⏰'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.nom}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {s.equipe} · Objectif : <strong style={{ color: 'var(--accent-blue)' }}>{s.objectif.toLocaleString()} pcs</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-indigo)', whiteSpace: 'nowrap' }}>
                    {s.heures}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              background: saved ? 'var(--status-ok)' : 'var(--accent-indigo)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: '0.2s'
            }}
          >
            {saved
              ? <span key="saved" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> Configuration enregistrée !</span>
              : <span key="idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Save size={18} /> Valider l'organisation ({selectedNb} {selectedNb > 1 ? 'shifts' : 'shift'})</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANTS UI ────────────────────────────────────────────────────────────

// Composant: Modal Déclaration Absence
const AbsenceModal = ({ onClose, operateurs, onDeclareAbsence }) => {
  const [form, setForm] = useState({ operateur_id: '', motif: 'Maladie', notes: '' });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    if (onDeclareAbsence && form.operateur_id) {
      onDeclareAbsence(form.operateur_id, form.motif);
    }
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--status-critical-bg)', padding: '0.6rem', borderRadius: '50%' }}>
              <UserX size={22} color="var(--status-critical)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Déclarer une Absence</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>L'IA identifiera les remplaçants disponibles</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Opérateur absent</label>
            <select className="form-select" value={form.operateur_id} onChange={e => setForm({ ...form, operateur_id: e.target.value })}>
              <option value="">-- Sélectionner un opérateur --</option>
              {operateurs.filter(o => o.statut === 'present').map(o => (
                <option key={o.id} value={o.id}>{o.prenom} {o.nom} — {o.ligne_origine}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Motif</label>
            <select className="form-select" value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}>
              {['Maladie', 'Congé annuel', 'Accident de travail', 'RDV médical', 'Absence injustifiée', 'Formation'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optionnel)</label>
            <textarea className="form-select" style={{ resize: 'none', height: '70px' }} placeholder="Ex: Certificat médical à fournir..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button
            onClick={handleSave}
            disabled={!form.operateur_id || saved}
            style={{ width: '100%', padding: '0.75rem', background: saved ? 'var(--status-ok)' : 'var(--status-critical)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: '0.2s', opacity: !form.operateur_id ? 0.5 : 1 }}
          >
            {saved
              ? <span key="saved" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> Absence enregistrée !</span>
              : <span key="idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> Confirmer l'absence</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Composant: Barre de montée en régime (Ramping) ────────────────────────────
const RampingBar = ({ efficienceInitiale, duree, cadence }) => {
  const steps = [
    { label: 'T+0', pct: efficienceInitiale },
    { label: `T+${Math.round(duree * 0.33)}min`, pct: Math.round(efficienceInitiale + (100 - efficienceInitiale) * 0.4) },
    { label: `T+${Math.round(duree * 0.66)}min`, pct: Math.round(efficienceInitiale + (100 - efficienceInitiale) * 0.75) },
    { label: `T+${duree}min`, pct: 100 },
  ];
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '36px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ width: '100%', height: `${s.pct * 0.36}px`, background: s.pct >= 90 ? 'var(--status-ok)' : s.pct >= 70 ? 'var(--accent-blue)' : s.pct >= 50 ? 'var(--status-warning)' : 'var(--status-critical)', borderRadius: '3px 3px 0 0', opacity: 0.85, transition: '0.5s ease', minHeight: '4px' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '3px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}<br /><span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{s.pct}%</span></div>
        ))}
      </div>
    </div>
  );
};

// ── Composant: Carte candidat avec données SAIOT + Gemini ─────────────────────
const CandidatCard = ({ candidat, poste, index, onAssign, processingId, isRecommended }) => {
  const tempsAdapt = calculerTempsAdaptation(candidat, poste);
  const ramping = calculerRampingTime(candidat, poste);
  const arret = analyserArretLigne(poste, candidat, tempsAdapt);
  const niveauOp = candidat.competences?.[poste.competence] || 0;
  const NIVEAUX = ['—', 'Débutant', 'En cours', 'Autonome', 'Expert'];
  const scoreSAIOT = candidat.score_saiot || 0;
  const pertePcs = Math.round((poste.cadence * tempsAdapt) / 60);

  const scoreColor = scoreSAIOT >= 80 ? 'var(--status-ok)' : scoreSAIOT >= 55 ? 'var(--status-warning)' : 'var(--status-critical)';
  const scoreBg = scoreSAIOT >= 80 ? 'var(--status-ok-bg)' : scoreSAIOT >= 55 ? 'var(--status-warning-bg)' : 'var(--status-critical-bg)';

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${isRecommended ? 'rgba(16,185,129,0.45)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: isRecommended ? '0 0 20px rgba(16,185,129,0.08)' : 'none'
    }}>
      {/* Header candidat */}
      <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isRecommended ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img src={candidat.photo} alt={candidat.nom} style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${isRecommended ? 'var(--status-ok)' : 'var(--border-subtle)'}` }} />
            {isRecommended && (
              <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--status-ok)', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={10} color="white" />
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{candidat.prenom} {candidat.nom}</h3>
              {isRecommended && <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'var(--status-ok-bg)', color: 'var(--status-ok)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>★ Recommandé</span>}
              <span style={{ fontSize: '0.72rem', fontWeight: 800, background: scoreBg, color: scoreColor, padding: '1px 7px', borderRadius: '4px' }}>SAIOT {scoreSAIOT}%</span>
            </div>
            <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem', marginTop: '2px', flexWrap: 'wrap' }}>
              <span>⭐ {candidat.rating}/5</span>
              <span>🏭 {candidat.ligne_origine}</span>
              <span>📋 {candidat.matricule}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onAssign(candidat)}
          disabled={processingId === candidat.id}
          style={{ background: isRecommended ? 'var(--accent-indigo)' : 'transparent', color: isRecommended ? 'white' : 'var(--accent-indigo)', border: `1px solid ${isRecommended ? 'transparent' : 'var(--accent-indigo)'}`, padding: '0.4rem 0.85rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          {processingId === candidat.id
            ? <span key="assigning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Affectation...</span>
            : <span key="idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Sparkles size={14} /> Affecter</span>}
        </button>
      </div>

      {/* Métriques : 4 blocs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border-subtle)' }}>
        {/* Niveau compétence */}
        <div style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Compétence</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: niveauOp >= poste.niveau_requis ? 'var(--status-ok)' : niveauOp > 0 ? 'var(--status-warning)' : 'var(--status-critical)' }}>{niveauOp}/4</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{NIVEAUX[niveauOp]}</div>
        </div>
        {/* Temps d'adaptation */}
        <div style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Adaptation</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: tempsAdapt <= 10 ? 'var(--status-ok)' : tempsAdapt <= 30 ? 'var(--status-warning)' : 'var(--status-critical)' }}>
            {tempsAdapt === 0 ? 'Immédiat' : `${tempsAdapt} min`}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>prise en main</div>
        </div>
        {/* Efficience initiale */}
        <div style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Efficience</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: ramping.efficienceInitiale >= 85 ? 'var(--status-ok)' : ramping.efficienceInitiale >= 60 ? 'var(--status-warning)' : 'var(--status-critical)' }}>{ramping.efficienceInitiale}%</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>au démarrage</div>
        </div>
        {/* Perte production */}
        <div style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Perte Prod.</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: pertePcs === 0 ? 'var(--status-ok)' : pertePcs < 50 ? 'var(--status-warning)' : 'var(--status-critical)' }}>{pertePcs} pcs</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>estimée</div>
        </div>
      </div>

      {/* Décision arrêt ligne + Ramping */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {/* Arrêt ligne */}
        <div style={{ padding: '0.8rem 1rem', borderRight: '1px solid var(--border-subtle)', background: arret.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1rem' }}>{arret.icon}</span>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: arret.color }}>{arret.label}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{arret.raison}</p>
        </div>
        {/* Courbe montée en régime */}
        <div style={{ padding: '0.8rem 1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={12} /> Montée en régime ({poste.cadence} p/h cible)
          </div>
          <RampingBar efficienceInitiale={ramping.efficienceInitiale} duree={ramping.duree} cadence={poste.cadence} />
        </div>
      </div>

      {/* Certifications */}
      {candidat.certifications?.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <ShieldCheck size={13} color="var(--status-ok)" />
          {candidat.certifications.map(c => (
            <span key={c} style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.08)', color: 'var(--status-ok)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helper: calcul score SAIOT côté frontend ──────────────────────────────────
function calculerScoreSAIOT(operateur, poste, weights = { competence: 0.4, rating: 0.3, impact: 0.3 }) {
  const niveauOp = operateur.competences?.[poste.competence] || 0;
  let score = 0;
  if (niveauOp < poste.niveau_requis) score -= 20;
  const scoreComp = (niveauOp / 4) * 100;
  const scoreRating = (operateur.rating / 5) * 100;
  const isVolant = !operateur.ligne_origine || operateur.ligne_origine.toLowerCase().includes('volant');
  const scoreImpact = isVolant ? 100 : operateur.ligne_origine?.includes('Ligne 1') ? 50 : 0;
  score += (scoreComp * weights.competence) + (scoreRating * weights.rating) + (scoreImpact * weights.impact);
  return Math.max(0, Math.round(score));
}

// ── Composant principal: Modal Allocation IA Gemini ───────────────────────────
const AiAgentModal = ({ poste, onClose, onAssign, operateurs, lignes }) => {
  if (!poste) return null;

  // Sélectionner les 3 meilleurs candidats disponibles via score SAIOT
  const candidats = operateurs
    .filter(o => o.statut === 'present' && !lignes.flatMap(l => l.postes).find(p => p.operateur?.id === o.id && p.id === poste.id))
    .map(o => ({ ...o, score_saiot: calculerScoreSAIOT(o, poste) }))
    .sort((a, b) => b.score_saiot - a.score_saiot)
    .slice(0, 3);

  const nomLigne = lignes.find(l => l.postes.find(p => p.id === poste.id))?.nom || '';
  const oeeGlobal = Math.round(lignes.reduce((s, l) => s + l.efficience, 0) / lignes.length);
  const postesVacants = lignes.reduce((s, l) => s + l.postes.filter(p => !p.operateur).length, 0);

  const [processingId, setProcessingId] = useState(null);
  const [geminiText, setGeminiText] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiDone, setGeminiDone] = useState(false);
  const [geminiError, setGeminiError] = useState(null);
  const [activeTab, setActiveTab] = useState('candidats'); // 'candidats' | 'gemini'
  const analysisRef = useRef(null);

  const handleAssign = (candidat) => {
    setProcessingId(candidat.id);
    setTimeout(() => { onAssign(candidat); setProcessingId(null); }, 900);
  };

  const lancerAnalyseGemini = useCallback(async () => {
    setGeminiText('');
    setGeminiLoading(true);
    setGeminiDone(false);
    setGeminiError(null);
    setActiveTab('gemini');

    await analyserAvecGemini(
      poste,
      candidats,
      { oeeGlobal, postesVacants, nomLigne },
      (chunk) => {
        setGeminiText(prev => prev + chunk);
        // Auto-scroll
        if (analysisRef.current) {
          analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
        }
      },
      () => { setGeminiLoading(false); setGeminiDone(true); },
      (err) => { setGeminiLoading(false); setGeminiError(err); }
    );
  }, [poste, candidats, oeeGlobal, postesVacants, nomLigne]);

  // Format markdown basique pour l'affichage
  const renderGeminiText = (text) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ') || line.startsWith('### ')) {
          return <div key={i} style={{ fontWeight: 800, fontSize: line.startsWith('## ') ? '1rem' : '0.9rem', color: line.startsWith('## ') ? 'var(--accent-indigo)' : 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.25rem', borderBottom: line.startsWith('## ') ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '0.25rem' }}>{line.replace(/##+ /, '')}</div>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <div key={i} style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>{line.replace(/\*\*/g, '')}</div>;
        }
        if (line.match(/\*\*/)) {
          const parts = line.split(/\*\*/);
          return <p key={i} style={{ marginBottom: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{p}</strong> : p)}
          </p>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', paddingLeft: '0.5rem' }}>
            <span style={{ color: 'var(--accent-indigo)', flexShrink: 0 }}>›</span>
            <span>{line.replace(/^[-•] /, '')}</span>
          </div>;
        }
        if (line.trim() === '') return <div key={i} style={{ height: '0.5rem' }} />;
        return <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>{line}</p>;
      });
  };

  const topCandidat = candidats[0];
  const topArret = topCandidat ? analyserArretLigne(poste, topCandidat, calculerTempsAdaptation(topCandidat, poste)) : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', width: '96vw', height: '86vh', maxHeight: '86vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--accent-indigo)', boxShadow: '0 0 50px rgba(99, 102, 241, 0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, var(--accent-indigo), #8b5cf6)', padding: '0.7rem', borderRadius: '50%', flexShrink: 0 }}>
              <Bot size={24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>SAIOT-AI · Smart Matching</h2>
                {topArret && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: topArret.bg, color: topArret.color, padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {topArret.icon} {topArret.recommendation}
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
                Poste : <strong style={{ color: 'var(--text-primary)' }}>{poste.nom}</strong> · Cadence : {poste.cadence} p/h · Niveau requis : {poste.niveau_requis}/4 · {poste.est_critique ? '🔴 Goulot critique' : '🟡 Poste standard'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem', padding: '0.25rem', marginLeft: '0.5rem' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          {[
            { id: 'candidats', label: `Candidats SAIOT (${candidats.length})`, icon: <Users size={15} /> },
            { id: 'gemini', label: 'Analyse Gemini AI', icon: <Sparkles size={15} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => tab.id === 'gemini' ? lancerAnalyseGemini() : setActiveTab('candidats')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent-indigo)' : 'transparent'}`, color: activeTab === tab.id ? 'var(--accent-indigo)' : 'var(--text-secondary)', fontWeight: activeTab === tab.id ? 700 : 400, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', transition: '0.15s' }}>
              {tab.icon} {tab.label}
              {tab.id === 'gemini' && !geminiDone && !geminiLoading && <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-indigo)', padding: '1px 5px', borderRadius: '3px' }}>Cliquer pour analyser</span>}
              {tab.id === 'gemini' && geminiLoading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-indigo)' }} />}
              {tab.id === 'gemini' && geminiDone && <span style={{ fontSize: '0.65rem', background: 'var(--status-ok-bg)', color: 'var(--status-ok)', padding: '1px 5px', borderRadius: '3px' }}>✓ Terminé</span>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div ref={analysisRef} className="modal-body" style={{ padding: '1.25rem', background: 'var(--bg-base)', flex: 1, overflowY: 'auto' }}>

          {activeTab === 'candidats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {candidats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <UserX size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>Aucun opérateur disponible pour ce poste.</p>
                </div>
              )}
              {candidats.map((cand, idx) => (
                <CandidatCard
                  key={cand.id}
                  candidat={cand}
                  poste={poste}
                  index={idx}
                  onAssign={handleAssign}
                  processingId={processingId}
                  isRecommended={idx === 0}
                />
              ))}
              {candidats.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.06)', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    💡 <strong style={{ color: 'var(--text-primary)' }}>Besoin d'une analyse approfondie ?</strong> Laissez Gemini AI évaluer l'impact réel sur votre usine.
                  </p>
                  <button onClick={lancerAnalyseGemini} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--accent-indigo)', border: 'none', borderRadius: '7px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                    <Sparkles size={15} /> Analyser avec Gemini
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gemini' && (
            <div>
              {/* Contexte envoyé à Gemini */}
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>📡 <strong style={{ color: 'var(--text-primary)' }}>Contexte envoyé à Gemini AI :</strong></span>
                {[`OEE ${oeeGlobal}%`, `${postesVacants} poste(s) vacant(s)`, `${candidats.length} candidats analysés`, poste.est_critique ? '🔴 Poste goulot' : '🟡 Poste standard'].map(t => (
                  <span key={t} style={{ fontSize: '0.72rem', background: 'var(--bg-surface)', padding: '2px 7px', borderRadius: '4px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>{t}</span>
                ))}
              </div>

              {/* Loading state */}
              {geminiLoading && geminiText === '' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--accent-indigo)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontSize: '0.9rem' }}>Gemini analyse la situation...</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Évaluation des impacts sur la production textile en cours</p>
                </div>
              )}

              {/* Streaming text */}
              {geminiText && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem 1.5rem', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <Bot size={18} color="var(--accent-indigo)" />
                    <span style={{ fontWeight: 700, color: 'var(--accent-indigo)', fontSize: '0.875rem' }}>SAIOT-AI · Rapport d'Analyse Décisionnelle</span>
                    {geminiLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-indigo)', marginLeft: 'auto' }} />}
                    {geminiDone && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--status-ok)', background: 'var(--status-ok-bg)', padding: '2px 8px', borderRadius: '4px' }}>✓ Analyse complète</span>}
                  </div>
                  <div>
                    {renderGeminiText(geminiText)}
                  </div>
                </div>
              )}

              {/* Error state */}
              {geminiError && (
                <div style={{ padding: '1rem', background: 'var(--status-critical-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: 'var(--status-critical)', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700 }}><AlertCircle size={16} /> Erreur</div>
                  <p>{geminiError}</p>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    👉 Ouvrez le fichier <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: '3px' }}>.env</code> dans le dossier frontend et vérifiez votre clé Google AI Studio.
                  </div>
                  <button onClick={lancerAnalyseGemini} style={{ marginTop: '0.75rem', padding: '0.4rem 0.85rem', background: 'transparent', border: '1px solid var(--status-critical)', borderRadius: '6px', color: 'var(--status-critical)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={13} /> Réessayer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Pinned */}
        <div style={{ padding: '0.85rem 1.5rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {activeTab === 'gemini'
              ? (geminiDone ? '✓ Analyse Gemini terminée — Faites défiler pour tout lire' : '📡 Analyse prédictive en direct')
              : `${candidats.length} remplaçant(s) disponible(s)`}
          </span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {activeTab === 'gemini' && (
              <button onClick={() => setActiveTab('candidats')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1.1rem', background: 'var(--accent-indigo)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                <Users size={14} /> Voir les candidats & Affecter
              </button>
            )}
            <button onClick={onClose} style={{ padding: '0.45rem 0.9rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE: DASHBOARD ──────────────────────────────────────────────────────────
function DashboardPage({ lignes, setLignes, setSelectedPoste, showAbsenceModal, setShowAbsenceModal, currentShift, onSelectShift, onOpenShiftConfig }) {
  const totalOperateurs = lignes.reduce((s, l) => s + l.postes.filter(p => p.operateur).length, 0);
  const totalPostes = lignes.reduce((s, l) => s + l.postes.length, 0);
  const postesVides = lignes.reduce((s, l) => s + l.postes.filter(p => !p.operateur).length, 0);
  const couverture = Math.round((totalOperateurs / totalPostes) * 100);
  const oeeGlobal = Math.round(lignes.reduce((s, l) => s + l.efficience, 0) / lignes.length);

  return (
    <div className="dashboard-scroll">
      {/* Bannière d'information Mode Consultation de Shift */}
      {currentShift && currentShift.id !== 1 && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '12px',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.25)', padding: '0.55rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Consultation active : {currentShift.nom} ({currentShift.heures})
                <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.25)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {currentShift.equipe}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Objectif de l'équipe : <strong style={{ color: 'var(--text-primary)' }}>{currentShift.objectif.toLocaleString()} pièces</strong> · Production estimée : <strong style={{ color: 'var(--status-ok)' }}>{currentShift.production.toLocaleString()} pièces</strong> · TRS cible : <strong style={{ color: 'var(--accent-indigo)' }}>{currentShift.efficience}%</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => onOpenShiftConfig && onOpenShiftConfig()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Settings size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Régler shifts
            </button>
            <button
              onClick={() => onSelectShift(1)}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid var(--accent-blue)',
                color: 'white',
                borderRadius: '6px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ← Revenir au Shift 1 (Matin)
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Supervision Temps Réel</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Gestion IA des aléas de production · <strong style={{ color: 'var(--text-primary)' }}>{currentShift?.nom || 'Shift Matin'}</strong> ({currentShift?.heures || '06:00–14:00'}) — {currentShift?.equipe || 'Équipe Alpha'}
          </p>
        </div>
        <button onClick={() => setShowAbsenceModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'var(--status-critical)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          <UserMinus size={16} /> Déclarer Absence
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-data">
            <h4>Couverture Postes</h4>
            <div className="value">{couverture}%</div>
            <div className="trend"><ArrowUpRight size={13} /> {totalOperateurs}/{totalPostes} opérateurs</div>
          </div>
        </div>
        <div className="kpi-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="kpi-icon" style={{ color: 'var(--status-critical)', background: 'var(--status-critical-bg)' }}><UserMinus size={22} /></div>
          <div className="kpi-data">
            <h4>Postes Vacants</h4>
            <div className="value" style={{ color: 'var(--status-critical)' }}>{postesVides}</div>
            <div className="trend" style={{ color: 'var(--status-warning)' }}>Nécessitent un remplaçant</div>
          </div>
        </div>
        <div className="kpi-card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
          <div className="kpi-icon" style={{ color: 'var(--status-ok)', background: 'var(--status-ok-bg)' }}><Activity size={22} /></div>
          <div className="kpi-data">
            <h4>OEE Global</h4>
            <div className="value" style={{ color: 'var(--status-ok)' }}>{oeeGlobal}%</div>
            <div className="trend" style={{ color: 'var(--status-ok)' }}>Objectif usine: 90%</div>
          </div>
        </div>
        <div className="kpi-card" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
          <div className="kpi-icon" style={{ color: 'var(--accent-indigo)', background: 'rgba(99,102,241,0.1)' }}><Bot size={22} /></div>
          <div className="kpi-data">
            <h4>Agent IA</h4>
            <div className="value" style={{ color: 'var(--accent-indigo)', fontSize: '1.25rem' }}>Actif</div>
            <div className="trend" style={{ color: 'var(--accent-indigo)' }}><Sparkles size={13} /> Smart Matching Prêt</div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="lines-area">
          {lignes.map(ligne => (
            <div key={ligne.id} className="line-container">
              <div className="line-header">
                <div className="line-title">
                  <Factory size={20} color="var(--accent-indigo)" />
                  <h3>{ligne.nom}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'var(--bg-base)', padding: '0.3rem 0.75rem', borderRadius: '99px', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Production: </span>
                    <span style={{ color: 'var(--status-ok)', fontWeight: 700 }}>{ligne.production.toLocaleString()}/{ligne.objectif.toLocaleString()} pcs</span>
                  </div>
                  <span style={{ color: 'var(--status-ok)', fontWeight: 700 }}>OEE: {ligne.efficience}%</span>
                </div>
              </div>
              <div className="stations-grid">
                {ligne.postes.map(poste => {
                  const isVide = !poste.operateur;
                  const isCritical = isVide && poste.est_critique;
                  return (
                    <div key={poste.id} className={`station-card ${isCritical ? 'alert-critical' : ''}`}>
                      <div className="station-header">
                        <div>
                          <div className="station-name">{poste.nom}</div>
                          <div className="station-reqs">
                            <span>🎯 {poste.cadence} p/h</span>
                            {poste.est_critique && <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>• Goulot</span>}
                          </div>
                        </div>
                        <span className={`status-badge ${isVide ? (poste.est_critique ? 'badge-critical' : 'badge-warning') : 'badge-ok'}`}>
                          {isVide ? 'Vide' : 'Actif'}
                        </span>
                      </div>
                      {poste.operateur ? (
                        <div className="operator-slot">
                          <img src={poste.operateur.photo} alt={poste.operateur.nom} className="avatar" />
                          <div className="op-details">
                            <span className="op-name">{poste.operateur.nom}</span>
                            <span className="op-perf"><Star className="rating-star" /> {poste.operateur.rating} Rating</span>
                          </div>
                        </div>
                      ) : (
                        <div className="operator-slot" style={{ borderTop: 'none', paddingTop: 0 }}>
                          <button className="btn-resolve" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo)', borderColor: 'rgba(99,102,241,0.3)' }} onClick={() => setSelectedPoste(poste)}>
                            <Sparkles size={15} /> Demander à l'IA
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="alerts-panel">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={18} /> Événements</h3>
            <div className="alert-item critical">
              <AlertTriangle size={22} style={{ color: 'var(--status-critical)', flexShrink: 0 }} />
              <div className="alert-content">
                <h5>Absence Critique — Ligne 1</h5>
                <p>L'Automate Pose Poche est à l'arrêt. Goulot d'étranglement. Impact -15% OEE.</p>
              </div>
            </div>
            <div className="alert-item">
              <UserMinus size={22} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />
              <div className="alert-content">
                <h5>Absence Mineure — Ligne 2</h5>
                <p>Contrôle Qualité Final vide. Buffer 200 pcs disponible. Impact faible.</p>
              </div>
            </div>
            <div className="alert-item" style={{ borderLeft: '3px solid var(--status-warning)' }}>
              <AlertCircle size={22} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />
              <div className="alert-content">
                <h5>Certification Expirante</h5>
                <p>Nadia Lami — Automate Barudan expire dans 2 jours. Renouveler urgemment.</p>
              </div>
            </div>
          </div>

          <div className="alerts-panel">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={18} color="var(--accent-indigo)" /> Actions Rapides</h3>
            {lignes.flatMap(l => l.postes.filter(p => !p.operateur).map(p => ({ ...p, ligne: l.nom }))).map(p => (
              <button key={p.id} onClick={() => setSelectedPoste(p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'var(--bg-base)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.65rem 0.9rem', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span><span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>● </span>{p.nom}</span>
                <span style={{ color: 'var(--accent-indigo)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><Bot size={13} /> Résoudre</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: LIGNES DE PRODUCTION ────────────────────────────────────────────────
function LignesPage({ lignes }) {
  const [expandedLigne, setExpandedLigne] = useState(1);
  const [showAddPoste, setShowAddPoste] = useState(false);

  return (
    <div className="dashboard-scroll">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Configuration des Lignes</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Gérez les lignes de production, postes et leurs prérequis</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'var(--accent-indigo)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          <Plus size={16} /> Nouvelle Ligne
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {lignes.map(ligne => {
          const postesOK = ligne.postes.filter(p => p.operateur).length;
          const pct = Math.round((postesOK / ligne.postes.length) * 100);
          const isOpen = expandedLigne === ligne.id;
          return (
            <div key={ligne.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div onClick={() => setExpandedLigne(isOpen ? null : ligne.id)} style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {isOpen ? <ChevronDown size={20} color="var(--accent-indigo)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{ligne.nom}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{ligne.postes.length} postes · {postesOK} couverts</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: ligne.efficience >= 90 ? 'var(--status-ok)' : 'var(--status-warning)' }}>{ligne.efficience}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OEE</div>
                  </div>
                  <div style={{ width: '100px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Couverture {pct}%</div>
                    <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--status-ok)' : pct >= 70 ? 'var(--status-warning)' : 'var(--status-critical)', borderRadius: '99px', transition: '0.5s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ padding: '0.4rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={15} /></button>
                    <button style={{ padding: '0.4rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: 'var(--status-critical)', cursor: 'pointer' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postes de Travail</h4>
                    <button onClick={() => setShowAddPoste(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: 'var(--accent-indigo)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      <Plus size={14} /> Ajouter Poste
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {ligne.postes.map(poste => (
                      <div key={poste.id} style={{ background: 'var(--bg-base)', border: `1px solid ${!poste.operateur ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`, borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{poste.nom}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{poste.competence} · Niv. {poste.niveau_requis}</div>
                          </div>
                          {poste.est_critique && <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: 'var(--status-critical)', padding: '2px 6px', borderRadius: '4px' }}>GOULOT</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span>🎯 {poste.cadence} pièces/h</span>
                          <span className={`status-badge ${poste.operateur ? 'badge-ok' : 'badge-critical'}`}>{poste.operateur ? 'Couvert' : 'Vacant'}</span>
                        </div>
                        {poste.operateur && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                            <img src={poste.operateur.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{poste.operateur.nom}</span>
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginLeft: 'auto' }}>★ {poste.operateur.rating}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE: MATRICE DE POLYVALENCE ─────────────────────────────────────────────
function PolyvalencePage({ operateurs }) {
  const [search, setSearch] = useState('');
  const filtered = operateurs.filter(o =>
    `${o.prenom} ${o.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  const getNiveauColor = (n) => {
    if (!n) return { bg: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' };
    if (n === 4) return { bg: 'rgba(16,185,129,0.15)', color: 'var(--status-ok)' };
    if (n === 3) return { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' };
    if (n === 2) return { bg: 'rgba(245,158,11,0.15)', color: 'var(--status-warning)' };
    return { bg: 'rgba(239,68,68,0.12)', color: 'var(--status-critical)' };
  };

  return (
    <div className="dashboard-scroll">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Matrice de Polyvalence</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Visualisez les niveaux de compétences de vos opérateurs</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
            <Download size={15} /> Exporter
          </button>
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[{ n: 4, label: 'Expert' }, { n: 3, label: 'Autonome' }, { n: 2, label: 'En cours' }, { n: 1, label: 'Débutant' }, { n: 0, label: 'Non formé' }].map(({ n, label }) => {
          const style = getNiveauColor(n);
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 28, height: 22, background: style.bg, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.color, fontWeight: 700, fontSize: '0.75rem' }}>{n || '—'}</div>
              {label}
            </div>
          );
        })}
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '300px' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Rechercher opérateur..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }} />
      </div>

      {/* Tableau */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: '180px' }}>Opérateur</th>
                <th style={{ padding: '0.875rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Ligne</th>
                <th style={{ padding: '0.875rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Rating</th>
                {COMPETENCES_LIST.map(c => (
                  <th key={c} style={{ padding: '0.875rem 0.4rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: '80px' }}>{c}</th>
                ))}
                <th style={{ padding: '0.875rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Certif.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((op, idx) => (
                <tr key={op.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <img src={op.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{op.prenom} {op.nom}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{op.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{op.ligne_origine}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>★ {op.rating}</span>
                  </td>
                  {COMPETENCES_LIST.map(c => {
                    const n = op.competences[c] || 0;
                    const style = getNiveauColor(n);
                    return (
                      <td key={c} style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <div style={{ width: 32, height: 28, background: style.bg, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: style.color, fontWeight: 700, fontSize: '0.8rem' }}>
                          {n || '—'}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    {op.certifications.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center' }}>
                        {op.certifications.map(c => <span key={c} style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: 'var(--status-ok)', padding: '2px 5px', borderRadius: '4px' }}>{c.split(' ')[0]}</span>)}
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: RAPPORTS & TRS ─────────────────────────────────────────────────────
function RapportsPage({ lignes, operateurs }) {
  const totalProd = lignes.reduce((s, l) => s + l.production, 0);
  const totalObj = lignes.reduce((s, l) => s + l.objectif, 0);
  const absents = operateurs.filter(o => o.statut === 'absent').length;
  const tauxAbs = Math.round((absents / operateurs.length) * 100);

  const BarChart = ({ value, max, color }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ height: '8px', background: 'var(--bg-base)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '99px', transition: '0.8s ease' }} />
      </div>
    </div>
  );

  const semaine = [
    { jour: 'Lun', l1: 92, l2: 85, l3: 90 },
    { jour: 'Mar', l1: 95, l2: 87, l3: 93 },
    { jour: 'Mer', l1: 89, l2: 82, l3: 88 },
    { jour: 'Jeu', l1: 97, l2: 91, l3: 92 },
    { jour: 'Ven', l1: 94, l2: 88, l3: 91 },
  ];

  return (
    <div className="dashboard-scroll">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rapports & Indicateurs TRS</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Semaine du 13 au 18 octobre 2026</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
          <Download size={15} /> Exporter PDF
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Production Semaine', value: `${(totalProd / 1000).toFixed(1)}K`, sub: `Obj: ${(totalObj / 1000).toFixed(1)}K pcs`, icon: <Target size={20} />, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.1)' },
          { label: 'OEE Moyen', value: `${Math.round(lignes.reduce((s, l) => s + l.efficience, 0) / lignes.length)}%`, sub: 'Objectif: ≥ 90%', icon: <Activity size={20} />, color: 'var(--status-ok)', bg: 'var(--status-ok-bg)' },
          { label: 'Taux d\'Absentéisme', value: `${tauxAbs}%`, sub: `${absents} absent(s) aujourd'hui`, icon: <CalendarOff size={20} />, color: 'var(--status-critical)', bg: 'var(--status-critical-bg)' },
          { label: 'Score Polyvalence', value: '3.6/4', sub: 'Niveau moyen équipe', icon: <Award size={20} />, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderColor: `${k.color}33` }}>
            <div className="kpi-icon" style={{ color: k.color, background: k.bg }}>{k.icon}</div>
            <div className="kpi-data">
              <h4>{k.label}</h4>
              <div className="value" style={{ color: k.color, fontSize: '1.6rem' }}>{k.value}</div>
              <div className="trend" style={{ color: 'var(--text-secondary)' }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Graphe OEE Semaine */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={18} color="var(--accent-indigo)" /> OEE par Ligne (Semaine)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '160px' }}>
            {semaine.map((jour) => (
              <div key={jour.jour} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '140px' }}>
                  {[{ v: jour.l1, c: '#6366f1' }, { v: jour.l2, c: '#3b82f6' }, { v: jour.l3, c: '#10b981' }].map((b, i) => (
                    <div key={i} style={{ width: 14, height: `${b.v}%`, background: b.c, borderRadius: '3px 3px 0 0', opacity: 0.85 }} title={`${b.v}%`} />
                  ))}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{jour.jour}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem' }}>
            {[{ c: '#6366f1', label: 'Ligne 1' }, { c: '#3b82f6', label: 'Ligne 2' }, { c: '#10b981', label: 'Ligne 3' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: l.c }} /> {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* OEE par Ligne */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PieChart size={18} color="var(--accent-blue)" /> Performance Lignes</h3>
          {lignes.map((l, i) => {
            const colors = ['var(--accent-indigo)', 'var(--accent-blue)', 'var(--status-ok)'];
            return (
              <div key={l.id} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ligne {l.id}</span>
                  <span style={{ fontWeight: 700, color: colors[i] }}>{l.efficience}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-base)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${l.efficience}%`, background: colors[i], borderRadius: '99px' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>{l.production.toLocaleString()} / {l.objectif.toLocaleString()} pcs</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historique Absences */}
      <div style={{ marginTop: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CalendarOff size={18} color="var(--status-warning)" /> Historique des Absences</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.15)' }}>
              {['Date', 'Opérateur', 'Motif', 'Poste Impacté', 'Statut'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockAbsencesHistory.map((a, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.date}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{a.operateur}</td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{a.motif}</td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{a.poste}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: a.statut === 'Couvert' ? 'var(--status-ok-bg)' : 'var(--status-critical-bg)', color: a.statut === 'Couvert' ? 'var(--status-ok)' : 'var(--status-critical)' }}>{a.statut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAGE: PARAMÈTRES ─────────────────────────────────────────────────────────
function ParametresPage({ currentUser, shifts, nombreShifts, onSaveShiftConfig }) {
  const [activeSection, setActiveSection] = useState('profil');
  const [weights, setWeights] = useState({ competence: 40, rating: 30, impact: 30 });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getParametresFromAPI()
      .then(res => {
        if (res && res.competence !== undefined) {
          setWeights({ competence: res.competence, rating: res.rating, impact: res.impact });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveWeights = async () => {
    try {
      await updateParametresInAPI(weights);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.warn('Erreur sauvegarde paramètres:', e);
    }
  };

  const sections = [
    { id: 'profil', label: 'Profil Utilisateur', icon: <UserCheck size={16} /> },
    { id: 'shifts', label: 'Shifts & Organisation', icon: <Clock size={16} /> },
    { id: 'algorithme', label: 'Algorithme SAIOT', icon: <Bot size={16} /> },
    { id: 'roles', label: 'Rôles & Accès', icon: <ShieldCheck size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

  const totalW = weights.competence + weights.rating + weights.impact;

  return (
    <div className="dashboard-scroll">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Paramètres</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Configuration du système SAIOT & Gestion des Équipes</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        {/* Menu latéral */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '0.5rem', height: 'fit-content' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.85rem', background: activeSection === s.id ? 'rgba(99,102,241,0.12)' : 'transparent', border: 'none', borderRadius: '8px', color: activeSection === s.id ? 'var(--accent-indigo)' : 'var(--text-secondary)', fontWeight: activeSection === s.id ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', marginBottom: '2px' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          {activeSection === 'profil' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Profil Utilisateur Connecté</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', padding: '1.25rem', background: 'var(--bg-base)', borderRadius: '10px' }}>
                <img src={currentUser?.avatar || 'https://randomuser.me/api/portraits/men/51.jpg'} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid var(--accent-indigo)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{currentUser?.prenom} {currentUser?.nom}</div>
                  <div style={{ color: 'var(--accent-indigo)', fontSize: '0.85rem', fontWeight: 600 }}>{currentUser?.role_label || 'Administrateur'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Session active : {currentUser?.email || 'admin@saiot.ma'} · Usine SAIOT Casablanca</div>
                </div>
              </div>
              {[
                { label: 'Nom complet', value: `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Rachid Benkirane', type: 'text' },
                { label: 'Email', value: currentUser?.email || 'admin@saiot.ma', type: 'email' },
                { label: 'Rôle dans l\'usine', value: currentUser?.role_label || "Chef d'Atelier (Admin)", type: 'text' },
                { label: 'Site industriel', value: 'SAIOT Casablanca — Bâtiment Textile A', type: 'text' }
              ].map(f => (
                <div key={f.label} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input type={f.type} className="form-select" defaultValue={f.value} style={{ fontFamily: 'inherit' }} />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'shifts' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Organisation des Shifts de Travail</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Configurez le nombre de shifts (1, 2, 3 ou 4) et les horaires de roulement des équipes dans l'usine.
              </p>

              <div style={{ background: 'var(--bg-base)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Nombre de shifts par jour</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {[
                    { nb: 1, label: '1 Shift', sub: 'Journée normale (8h)' },
                    { nb: 2, label: '2 Shifts (2x8)', sub: 'Matin & Après-midi' },
                    { nb: 3, label: '3 Shifts (3x8)', sub: 'Continu 24h/24' },
                    { nb: 4, label: '4 Shifts (4x8)', sub: 'Continu + Relève' }
                  ].map(item => (
                    <button
                      key={item.nb}
                      type="button"
                      onClick={() => onSaveShiftConfig && onSaveShiftConfig(item.nb, shifts)}
                      style={{
                        padding: '0.85rem 0.5rem',
                        borderRadius: '10px',
                        border: `2px solid ${nombreShifts === item.nb ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                        background: nombreShifts === item.nb ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
                        color: nombreShifts === item.nb ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: '0.15s'
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.label}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {shifts && shifts.filter(s => s.actif === 1).map((s) => (
                  <div key={s.id} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{s.icon || '⏰'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.nom}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.equipe} · Objectif : <strong style={{ color: 'var(--accent-blue)' }}>{s.objectif.toLocaleString()} pcs</strong></div>
                      </div>
                    </div>
                    <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-indigo)', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                      {s.heures}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'algorithme' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Poids de l'Algorithme SAIOT</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>La somme des poids doit être égale à 100%. Ajustez selon les priorités de votre atelier.</p>

              <div style={{ background: 'var(--bg-base)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: totalW === 100 ? 'var(--status-ok)' : 'var(--status-critical)', fontWeight: 700 }}>
                    {totalW === 100 ? '✓ Total : 100% — Configuration valide' : `⚠ Total : ${totalW}% — Doit être 100%`}
                  </span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${weights.competence}%`, background: 'var(--accent-indigo)', transition: '0.3s' }} />
                  <div style={{ width: `${weights.rating}%`, background: 'var(--accent-blue)', transition: '0.3s' }} />
                  <div style={{ width: `${weights.impact}%`, background: 'var(--status-ok)', transition: '0.3s' }} />
                </div>
              </div>

              {[
                { key: 'competence', label: 'Compétences techniques', color: 'var(--accent-indigo)', desc: 'Niveau de maîtrise de la machine (1→4)' },
                { key: 'rating', label: 'Rating de performance', color: 'var(--accent-blue)', desc: 'Évaluation globale sur 5 étoiles' },
                { key: 'impact', label: 'Impact sur la ligne', color: 'var(--status-ok)', desc: 'Volant=100, Même ligne=50, Autre ligne=0' },
              ].map(w => (
                <div key={w.key} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.label}</label>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>{w.desc}</p>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: w.color, minWidth: '42px', textAlign: 'right' }}>{weights[w.key]}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={weights[w.key]} onChange={e => setWeights({ ...weights, [w.key]: +e.target.value })}
                    style={{ width: '100%', accentColor: w.color, cursor: 'pointer', height: '4px' }} />
                </div>
              ))}

              <button onClick={handleSaveWeights} disabled={totalW !== 100} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: saveSuccess ? 'var(--status-ok)' : totalW === 100 ? 'var(--accent-indigo)' : 'var(--bg-base)', border: 'none', borderRadius: '8px', color: totalW === 100 ? 'white' : 'var(--text-muted)', fontWeight: 700, cursor: totalW === 100 ? 'pointer' : 'not-allowed', transition: '0.2s' }}>
                {saveSuccess
                  ? <span key="saved" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> Poids enregistrés en base !</span>
                  : <span key="idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Save size={16} /> Appliquer les Poids</span>}
              </button>
            </div>
          )}

          {activeSection === 'roles' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Matrice des Droits</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Fonctionnalité</th>
                      {['Administrateur', 'Chef d\'Atelier', 'RH (Lecteur)'].map(r => <th key={r} style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{r}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Voir le tableau de bord', true, true, true],
                      ['Déclarer une absence', true, true, false],
                      ['Affecter un opérateur (IA)', true, true, false],
                      ['Modifier le rating', true, true, false],
                      ['Créer/supprimer un opérateur', true, false, false],
                      ['Configurer les lignes/postes', true, false, false],
                      ['Consulter les rapports', true, true, true],
                      ['Gérer les utilisateurs', true, false, false],
                      ['Modifier l\'algorithme', true, false, false],
                    ].map(([feat, ...perms], i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.7rem 1rem', fontWeight: 500 }}>{feat}</td>
                        {perms.map((p, pi) => (
                          <td key={pi} style={{ textAlign: 'center', padding: '0.7rem' }}>
                            {p ? <Check size={17} style={{ color: 'var(--status-ok)', display: 'inline' }} /> : <X size={17} style={{ color: 'var(--status-critical)', opacity: 0.5, display: 'inline' }} />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Préférences de Notifications</h2>
              {[
                { label: 'Poste critique vacant > 15 min', desc: 'Alerte immédiate dès qu\'un goulot est sans opérateur', defaultChecked: true },
                { label: 'Certification expirante (< 7 jours)', desc: 'Rappel pour renouveler les certifications machines', defaultChecked: true },
                { label: 'OEE d\'une ligne < 80%', desc: 'Notification si une ligne est en sous-performance', defaultChecked: true },
                { label: 'Taux d\'absentéisme > 10%', desc: 'Alerte si trop d\'opérateurs sont absents sur un shift', defaultChecked: false },
                { label: 'Rapport journalier automatique', desc: 'Résumé automatique envoyé à 17h chaque jour', defaultChecked: false },
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.desc}</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', cursor: 'pointer', flexShrink: 0, marginLeft: '1rem' }}>
                    <input type="checkbox" defaultChecked={n.defaultChecked} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', inset: 0, background: n.defaultChecked ? 'var(--accent-indigo)' : 'var(--bg-surface-hover)', borderRadius: '99px', transition: '0.2s' }} />
                    <span style={{ position: 'absolute', left: n.defaultChecked ? '20px' : '3px', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s' }} />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPALE ───────────────────────────────────────────────────────────
export default function App() {
  // ── 1. Authentification & Utilisateur Connecté
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('saiot_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ── 2. Gestion des Shifts & Roulements
  const [shifts, setShifts] = useState(() => {
    try {
      const saved = localStorage.getItem('saiot_shifts');
      return saved ? JSON.parse(saved) : DEFAULT_SHIFTS;
    } catch {
      return DEFAULT_SHIFTS;
    }
  });
  const [nombreShifts, setNombreShifts] = useState(() => {
    try {
      const saved = localStorage.getItem('saiot_nb_shifts');
      return saved ? Number(saved) : 3;
    } catch {
      return 3;
    }
  });
  const [currentShiftId, setCurrentShiftId] = useState(1);
  const [showShiftConfig, setShowShiftConfig] = useState(false);
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ── 3. Données Métier & Lignes
  const [lignes, setLignes] = useState(mockLignes);
  const [operateurs, setOperateurs] = useState(mockOperateurs);
  const [selectedPoste, setSelectedPoste] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Charger les données de la base SQLite et des Shifts au démarrage
  useEffect(() => {
    const initData = async () => {
      const isOnline = await checkBackendHealth();
      setIsBackendConnected(isOnline);
      if (isOnline) {
        try {
          const [apiLignes, apiOps, shiftsData] = await Promise.all([
            getLignesFromAPI(),
            getOperateursFromAPI(),
            getShiftsAPI().catch(() => null)
          ]);
          if (apiLignes && apiLignes.length > 0) setLignes(apiLignes);
          if (apiOps && apiOps.length > 0) setOperateurs(apiOps);
          if (shiftsData && shiftsData.shifts) {
            setShifts(shiftsData.shifts);
            if (shiftsData.nombreShiftsActifs) setNombreShifts(shiftsData.nombreShiftsActifs);
          }
        } catch (err) {
          console.warn('Erreur chargement API, mode local actif:', err);
        }
      }
    };
    initData();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('saiot_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('saiot_user');
    setShowUserMenu(false);
  };

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('saiot_user', JSON.stringify(user));
    setShowUserMenu(false);
  };

  const handleSaveShiftConfig = async (newNombre, newShifts) => {
    setNombreShifts(newNombre);
    const updated = newShifts.map(s => ({ ...s, actif: s.id <= newNombre ? 1 : 0 }));
    setShifts(updated);
    if (currentShiftId > newNombre) {
      setCurrentShiftId(1);
    }
    try {
      localStorage.setItem('saiot_nb_shifts', String(newNombre));
      localStorage.setItem('saiot_shifts', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erreur localStorage shifts:', e);
    }
    if (isBackendConnected) {
      try {
        await saveShiftConfigAPI(newNombre, updated);
      } catch (e) {
        console.warn('Erreur sauvegarde config shifts en API:', e);
      }
    }
  };

  // Affectation d'un remplaçant (avec synchronisation base SQLite)
  const handleAssign = async (candidat) => {
    setLignes(prev => prev.map(l => ({
      ...l,
      postes: l.postes.map(p =>
        p.id === selectedPoste.id
          ? { ...p, operateur: { id: candidat.id, nom: `${candidat.prenom || ''} ${candidat.nom}`.trim(), photo: candidat.photo, rating: candidat.rating, statut: 'present' } }
          : p
      )
    })));
    setSelectedPoste(null);

    if (isBackendConnected) {
      try {
        await postAffectationToAPI(selectedPoste.id, candidat.id);
        const [apiLignes, apiOps] = await Promise.all([getLignesFromAPI(), getOperateursFromAPI()]);
        setLignes(apiLignes);
        setOperateurs(apiOps);
      } catch (err) {
        console.warn('Erreur synchronisation API affectation:', err);
      }
    }
  };

  // Déclaration d'absence (avec synchronisation base SQLite)
  const handleDeclareAbsence = async (operateurId, motif) => {
    const opIdNum = Number(operateurId);
    setOperateurs(prev => prev.map(o => o.id === opIdNum ? { ...o, statut: 'absent' } : o));
    setLignes(prev => prev.map(l => ({
      ...l,
      postes: l.postes.map(p => p.operateur?.id === opIdNum ? { ...p, operateur: null } : p)
    })));

    if (isBackendConnected) {
      try {
        await postAbsenceToAPI(opIdNum, motif);
        const [apiLignes, apiOps] = await Promise.all([getLignesFromAPI(), getOperateursFromAPI()]);
        setLignes(apiLignes);
        setOperateurs(apiOps);
      } catch (err) {
        console.warn('Erreur synchronisation API absence:', err);
      }
    }
  };

  // Si l'utilisateur n'est pas connecté, afficher la page de connexion
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Shifts actifs et shift consulté
  const activeShifts = shifts.filter(s => s.actif === 1);
  const currentShift = shifts.find(s => s.id === currentShiftId) || activeShifts[0] || shifts[0];

  // Adaptation dynamique des lignes selon le shift consulté
  const displayLignes = lignes.map(l => {
    if (currentShiftId === 2) {
      const shift2Effs = { 1: 89, 2: 86, 3: 89 };
      const shift2Prods = { 1: 1580, 2: 1220, 3: 1410 };
      return { ...l, efficience: shift2Effs[l.id] || l.efficience, production: shift2Prods[l.id] || l.production };
    }
    if (currentShiftId === 3) {
      const shift3Effs = { 1: 93, 2: 90, 3: 93 };
      const shift3Prods = { 1: 1100, 2: 950, 3: 900 };
      const shift3Objs = { 1: 1200, 2: 1000, 3: 1000 };
      return { ...l, efficience: shift3Effs[l.id] || l.efficience, production: shift3Prods[l.id] || l.production, objectif: shift3Objs[l.id] || l.objectif };
    }
    if (currentShiftId === 4) {
      const shift4Effs = { 1: 94, 2: 92, 3: 93 };
      const shift4Prods = { 1: 950, 2: 720, 3: 650 };
      const shift4Objs = { 1: 1000, 2: 750, 3: 750 };
      return { ...l, efficience: shift4Effs[l.id] || l.efficience, production: shift4Prods[l.id] || l.production, objectif: shift4Objs[l.id] || l.objectif };
    }
    return l;
  });

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard size={18} /> },
    { id: 'lignes', label: 'Lignes de Production', icon: <Factory size={18} /> },
    { id: 'polyvalence', label: 'Matrice Polyvalence', icon: <Users size={18} /> },
    { id: 'rapports', label: 'Rapports & TRS', icon: <TrendingUp size={18} /> },
  ];

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            lignes={displayLignes}
            setLignes={setLignes}
            setSelectedPoste={setSelectedPoste}
            showAbsenceModal={showAbsenceModal}
            setShowAbsenceModal={setShowAbsenceModal}
            currentShift={currentShift}
            onSelectShift={(id) => setCurrentShiftId(id)}
            onOpenShiftConfig={() => setShowShiftConfig(true)}
          />
        );
      case 'lignes': return <LignesPage lignes={displayLignes} />;
      case 'polyvalence': return <PolyvalencePage operateurs={operateurs} />;
      case 'rapports': return <RapportsPage lignes={displayLignes} operateurs={operateurs} />;
      case 'parametres':
        return (
          <ParametresPage
            currentUser={currentUser}
            shifts={shifts}
            nombreShifts={nombreShifts}
            onSaveShiftConfig={handleSaveShiftConfig}
          />
        );
      default: return null;
    }
  };

  const postesVacantsCount = displayLignes.reduce((s, l) => s + l.postes.filter(p => !p.operateur).length, 0);

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Cpu className="logo-icon" size={26} />
          <div>
            <span className="brand-name">SAIOT</span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>v1.2 · Textile</div>
          </div>
          {postesVacantsCount > 0 && (
            <div style={{ marginLeft: 'auto', background: 'var(--status-critical)', color: 'white', borderRadius: '99px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
              {postesVacantsCount}
            </div>
          )}
        </div>
        <nav className="nav-menu">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)} style={{ width: '100%', background: activeTab === item.id ? '' : 'transparent', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}>
              {item.icon} {item.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.5rem 0' }} />
          <button className={`nav-item ${activeTab === 'parametres' ? 'active' : ''}`} onClick={() => setActiveTab('parametres')} style={{ width: '100%', background: activeTab === 'parametres' ? '' : 'transparent', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}>
            <Settings size={18} /> Paramètres
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="topbar">
          <div className="shift-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* 1. Sélecteur de Shift Interactif */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowShiftMenu(!showShiftMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-ok)', boxShadow: '0 0 8px var(--status-ok)' }} />
                <Clock size={14} color="var(--accent-indigo)" />
                <span>{currentShift.nom} ({currentShift.heures})</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {/* Menu déroulant des shifts */}
              {showShiftMenu && (
                <div className="dropdown-menu-floating" style={{ left: 0, right: 'auto', minWidth: '320px' }}>
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Consulter un shift ({activeShifts.length} {activeShifts.length > 1 ? 'actifs' : 'actif'})
                    </span>
                    <button
                      onClick={() => { setShowShiftMenu(false); setShowShiftConfig(true); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Settings size={12} /> Configurer
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0.4rem 0' }}>
                    {activeShifts.map(s => (
                      <div
                        key={s.id}
                        className={`shift-option-item ${currentShiftId === s.id ? 'selected' : ''}`}
                        onClick={() => { setCurrentShiftId(s.id); setShowShiftMenu(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{s.icon || '⏰'}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.nom}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.equipe} · {s.heures}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{s.production.toLocaleString()} pcs</span>
                          <div style={{ fontSize: '0.68rem', color: 'var(--status-ok)', fontWeight: 700 }}>OEE {s.efficience}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Boutons d'accès direct 1-clic par Shift */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {activeShifts.map(s => (
                <button
                  key={s.id}
                  className={`shift-pill-btn ${currentShiftId === s.id ? 'active' : ''}`}
                  onClick={() => setCurrentShiftId(s.id)}
                  title={`Consulter ${s.nom}`}
                >
                  {s.icon} {s.code}
                </button>
              ))}
            </div>

            {/* 3. Bouton régler le nombre de shifts */}
            <button
              onClick={() => setShowShiftConfig(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600
              }}
              title="Choisir combien de shifts organisent l'usine"
            >
              <Layers size={13} /> {nombreShifts} Shifts
            </button>

            {/* 4. Statut SQLite */}
            <span style={{ fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '4px', background: isBackendConnected ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: isBackendConnected ? 'var(--status-ok)' : 'var(--status-warning)', border: `1px solid ${isBackendConnected ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isBackendConnected ? 'var(--status-ok)' : 'var(--status-warning)' }} />
              {isBackendConnected ? 'Base SQLite Active' : 'Mode Autonome'}
            </span>

            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Objectif Shift : <strong style={{ color: 'var(--text-primary)' }}>{currentShift.objectif.toLocaleString()} pcs</strong>
            </span>
          </div>

          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => setShowAbsenceModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: 'var(--status-critical)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              <UserMinus size={14} /> Absence
            </button>
            <Bell size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />

            {/* Profil utilisateur & Menu déconnexion */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '8px', background: showUserMenu ? 'rgba(255,255,255,0.06)' : 'transparent', transition: '0.15s' }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{currentUser.prenom} {currentUser.nom}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>{currentUser.role_label}</div>
                </div>
                <img src={currentUser.avatar} alt={currentUser.nom} style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--accent-indigo)' }} />
                <ChevronDown size={14} color="var(--text-muted)" />
              </div>

              {showUserMenu && (
                <div className="dropdown-menu-floating" style={{ minWidth: '270px' }}>
                  <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={currentUser.avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid var(--accent-indigo)' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentUser.prenom} {currentUser.nom}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentUser.email}</div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(99,102,241,0.15)', color: 'var(--accent-indigo)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '0.5rem 0.6rem' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Changer de profil rapide :
                    </span>
                    {DEMO_ACCOUNTS.filter(a => a.id !== currentUser.id).map(acc => (
                      <div
                        key={acc.id}
                        onClick={() => handleSwitchUser(acc)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)' }}
                        className="shift-option-item"
                      >
                        <img src={acc.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                        <span>{acc.prenom} {acc.nom} <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({acc.role})</span></span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.4rem 0.6rem 0' }}>
                    <button
                      onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem 0.6rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: 'var(--status-critical)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <LogOut size={14} /> Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {renderPage()}
      </main>

      {/* MODALS */}
      <AiAgentModal poste={selectedPoste} onClose={() => setSelectedPoste(null)} onAssign={handleAssign} operateurs={operateurs} lignes={displayLignes} />
      {showAbsenceModal && <AbsenceModal onClose={() => setShowAbsenceModal(false)} operateurs={operateurs} onDeclareAbsence={handleDeclareAbsence} />}
      {showShiftConfig && (
        <ShiftConfigModal
          onClose={() => setShowShiftConfig(false)}
          shifts={shifts}
          nombreShifts={nombreShifts}
          onSaveConfig={handleSaveShiftConfig}
        />
      )}
    </div>
  );
}
