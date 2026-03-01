/**
 * Liste des avatars pirate disponibles.
 * Chaque avatar a un id, un label et un emoji de fallback.
 * Les icones MUI correspondantes sont mappees dans le composant.
 */
export const pirateAvatars = [
  { id: 'skull', label: 'Crane', emoji: '\u2620\ufe0f' },
  { id: 'anchor', label: 'Ancre', emoji: '\u2693' },
  { id: 'ship', label: 'Navire', emoji: '\ud83c\udff4\u200d\u2620\ufe0f' },
  { id: 'sword', label: 'Sabre', emoji: '\u2694\ufe0f' },
  { id: 'treasure', label: 'Tresor', emoji: '\ud83d\udcb0' },
  { id: 'parrot', label: 'Perroquet', emoji: '\ud83e\udd9c' },
  { id: 'octopus', label: 'Kraken', emoji: '\ud83d\udc19' },
  { id: 'hook', label: 'Crochet', emoji: '\ud83e\ude9d' },
  { id: 'compass', label: 'Boussole', emoji: '\ud83e\udded' },
  { id: 'flag', label: 'Drapeau', emoji: '\ud83c\udff4' },
  { id: 'map', label: 'Carte', emoji: '\ud83d\uddfa\ufe0f' },
  { id: 'cannon', label: 'Canon', emoji: '\ud83d\udca3' },
];

/** Recupere l'emoji d'un avatar par son id */
export function getAvatarEmoji(avatarId) {
  return pirateAvatars.find((a) => a.id === avatarId)?.emoji || '\u2620\ufe0f';
}
