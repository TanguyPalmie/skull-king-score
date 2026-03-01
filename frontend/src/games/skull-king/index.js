/**
 * Module Skull King — definition du jeu pour le registre.
 * Theme pirate : or vieilli, rouge sang, fond ocean profond.
 */
import SkullKingGame from './SkullKingGame.jsx';
import SkullKingScores from './SkullKingScores.jsx';

export default {
  id: 'skull-king',
  name: 'Skull King',
  icon: '\u2620\ufe0f',
  description: 'Jeu de plis pirate \u2014 predisez vos plis et emportez le tresor !',
  minPlayers: 2,
  maxPlayers: 12,
  component: SkullKingGame,
  scoresComponent: SkullKingScores,
  color: '#d4af37',
  themeConfig: {
    primary: '#d4af37',
    secondary: '#c0392b',
    background: '#0d1117',
    paper: '#161b22',
    navBg: '#0a0e14',
    titleFont: '"Pirata One", Georgia, serif',
    bodyFont: 'Georgia, "Times New Roman", serif',
  },
};
