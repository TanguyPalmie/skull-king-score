/**
 * Registre central des jeux disponibles.
 * Contient les jeux "hardcodes" (Skull King) et ceux charges dynamiquement depuis l'API.
 */
import skullKing from './skull-king/index.js';
import GenericGame from './generic/GenericGame.jsx';
import GenericScores from './generic/GenericScores.jsx';

/** Jeux avec composants dedies (hardcodes) */
const builtInGames = [skullKing];

/** Cache des jeux dynamiques charges depuis l'API */
let dynamicGames = [];

/**
 * Charge les definitions de jeux depuis l'API et cree des entrees registry.
 * Appele au demarrage de l'app.
 */
export async function loadDynamicGames() {
  try {
    const res = await fetch('/api/game-definitions');
    if (!res.ok) return;
    const defs = await res.json();

    dynamicGames = defs
      .filter((def) => !builtInGames.some((g) => g.id === def.slug))
      .map((def) => ({
        id: def.slug,
        name: def.name,
        icon: def.icon,
        description: def.description,
        minPlayers: def.min_players,
        maxPlayers: def.max_players,
        // Les composants generiques recoivent gameConfig en prop
        component: function DynamicGameWrapper(props) {
          return <GenericGame {...props} gameConfig={def} />;
        },
        scoresComponent: function DynamicScoresWrapper() {
          return <GenericScores gameConfig={def} />;
        },
        color: def.theme_config?.primary || '#e67e22',
        themeConfig: def.theme_config || {},
        gameConfig: def,
      }));
  } catch {
    // Silently fail — les jeux hardcodes restent dispo
    dynamicGames = [];
  }
}

/** Tous les jeux disponibles (built-in + dynamiques) */
export function getAvailableGames() {
  return [...builtInGames, ...dynamicGames];
}

/** Recupere un jeu par son id/slug */
export function getGameById(id) {
  return getAvailableGames().find((g) => g.id === id) || null;
}
