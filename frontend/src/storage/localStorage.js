// Fallback local storage for offline usage

const GAME_KEY = 'skull-king-game';
const SETTINGS_KEY = 'skull-king-settings';

const defaultSettings = {
  lootEnabled: false,
  lootValues: [20, 30, -10],
  maxRounds: 10,
};

export function saveGameLocal(game) {
  localStorage.setItem(GAME_KEY, JSON.stringify(game));
}

export function loadGameLocal() {
  const raw = localStorage.getItem(GAME_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearGameLocal() {
  localStorage.removeItem(GAME_KEY);
}

export function saveSettingsLocal(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettingsLocal() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try { return { ...defaultSettings, ...JSON.parse(raw) }; } catch { return defaultSettings; }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
