/**
 * Gestion des profils joueurs dans localStorage.
 * Deux types de profils :
 *  - guest : joueur invite (juste un nom + avatar, pas de compte)
 *  - friend : ami avec un compte (lie a un userId)
 *
 * Chaque profil : { id, name, avatar, type, userId?, createdAt }
 */

const PROFILES_KEY = 'gamemaster-profiles';
const SELECTED_KEY = 'gamemaster-selected-profiles';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Recupere tous les profils sauvegardes */
export function getProfiles() {
  const raw = localStorage.getItem(PROFILES_KEY);
  if (!raw) return [];
  try {
    const profiles = JSON.parse(raw);
    // Migration : ajouter type 'guest' aux anciens profils
    return profiles.map((p) => ({ type: 'guest', ...p }));
  } catch {
    return [];
  }
}

/** Sauvegarde un nouveau profil guest */
export function saveProfile({ name, avatar }) {
  const profiles = getProfiles();
  const trimmed = name.trim();

  if (!trimmed) throw new Error('Le nom est obligatoire.');
  if (profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Ce nom existe deja.');
  }

  const profile = {
    id: generateId(),
    name: trimmed,
    avatar: avatar || 'skull',
    type: 'guest',
    createdAt: new Date().toISOString(),
  };

  profiles.push(profile);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  return profile;
}

/** Ajoute un ami comme profil joueur (lie a un userId) */
export function addFriendProfile({ userId, pseudo }) {
  const profiles = getProfiles();

  // Verifier si cet ami est deja ajoute
  if (profiles.some((p) => p.type === 'friend' && p.userId === userId)) {
    throw new Error('Cet ami est deja dans la liste.');
  }

  const profile = {
    id: generateId(),
    name: pseudo,
    avatar: 'skull',
    type: 'friend',
    userId,
    createdAt: new Date().toISOString(),
  };

  profiles.push(profile);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  return profile;
}

/** Supprime un profil par son id */
export function deleteProfile(id) {
  const profiles = getProfiles().filter((p) => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

  // Retirer aussi de la selection active
  const selected = getSelectedProfiles().filter((sid) => sid !== id);
  localStorage.setItem(SELECTED_KEY, JSON.stringify(selected));
}

/** Recupere un profil par son id */
export function getProfileById(id) {
  return getProfiles().find((p) => p.id === id) || null;
}

/** Sauvegarde les profils selectionnes pour la partie en cours */
export function setSelectedProfiles(ids) {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(ids));
}

/** Recupere les ids des profils selectionnes */
export function getSelectedProfiles() {
  const raw = localStorage.getItem(SELECTED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
