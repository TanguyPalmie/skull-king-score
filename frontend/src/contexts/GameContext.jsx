import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { getGameById, loadDynamicGames } from '../games/registry.jsx';
import { createGameTheme } from '../theme.js';
import defaultTheme from '../theme.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [activeGameId, setActiveGameId] = useState(null);
  const [gamesLoaded, setGamesLoaded] = useState(false);

  // Charger les jeux dynamiques au demarrage
  useEffect(() => {
    loadDynamicGames().finally(() => setGamesLoaded(true));
  }, []);

  const setActiveGame = useCallback((gameId) => {
    setActiveGameId(gameId);
  }, []);

  const clearActiveGame = useCallback(() => {
    setActiveGameId(null);
  }, []);

  const activeGame = activeGameId ? getGameById(activeGameId) : null;

  /** Theme dynamique : utilise le theme du jeu actif ou le theme par defaut */
  const theme = useMemo(() => {
    if (activeGame?.themeConfig && Object.keys(activeGame.themeConfig).length > 0) {
      return createGameTheme(activeGame.themeConfig);
    }
    return defaultTheme;
  }, [activeGame]);

  return (
    <GameContext.Provider value={{ activeGameId, activeGame, theme, gamesLoaded, setActiveGame, clearActiveGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
