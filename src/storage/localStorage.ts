import type { GameState, Settings, Player } from '../types';

const GAME_KEY = 'skull-king-game';
const SETTINGS_KEY = 'skull-king-settings';
const PLAYERS_KEY = 'skull-king-players';

const defaultSettings: Settings = {
  lootEnabled: false,
  lootValues: [20, 30, -10],
  maxRounds: 10,
};

export function saveGame(game: GameState): void {
  localStorage.setItem(GAME_KEY, JSON.stringify(game));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(GAME_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  localStorage.removeItem(GAME_KEY);
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function savePlayers(players: Player[]): void {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function loadPlayers(): Player[] {
  const raw = localStorage.getItem(PLAYERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Player[];
  } catch {
    return [];
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
