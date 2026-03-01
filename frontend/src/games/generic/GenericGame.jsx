import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  IconButton,
  Stack,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fade,
  Grow,
  TextField,
  LinearProgress,
} from '@mui/material';
import { Add, Remove, EmojiEvents, Stop } from '@mui/icons-material';
import { keyframes } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { getAvatarEmoji } from '../../data/pirateAvatars.js';

const popIn = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
`;
const slideUp = keyframes`
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;
const scorePulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

function storageKey(slug) {
  return `gamemaster-${slug}-game`;
}

function saveGameLocal(slug, game) {
  localStorage.setItem(storageKey(slug), JSON.stringify(game));
}

function loadGameLocal(slug) {
  const raw = localStorage.getItem(storageKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearGameLocal(slug) {
  localStorage.removeItem(storageKey(slug));
}

/**
 * GenericGame — composant universel pour tout jeu cree par l'admin.
 *
 * Props :
 *   players     — tableau de joueurs selectionnes
 *   isNew       — true = nouvelle partie
 *   gameConfig  — definition du jeu depuis game_definitions
 *     .slug, .name, .icon, .scoring_type ('simple'|'bid_tricks'),
 *     .default_rounds, .bonus_values [], .allow_custom_bonus
 */
/** Labels dynamiques selon le stepper_type du jeu */
const STEPPER_LABELS = {
  round: 'Manche',
  manche: 'Manche',
  phase: 'Phase',
  tour: 'Tour',
  niveau: 'Niveau',
  partie: 'Partie',
  age: 'Âge',
  main: 'Main',
};

export default function GenericGame({ players: selectedPlayers, isNew, gameConfig }) {
  const navigate = useNavigate();
  const slug = gameConfig?.slug || 'unknown';
  const scoringType = gameConfig?.scoring_type || 'simple';
  const maxRounds = gameConfig?.default_rounds || 10;
  const bonusValues = gameConfig?.bonus_values || [];
  const allowCustomBonus = gameConfig?.allow_custom_bonus || false;
  const stepLabel = STEPPER_LABELS[gameConfig?.stepper_type] || 'Manche';

  const [game, setGame] = useState(() => {
    if (isNew) {
      clearGameLocal(slug);
      return createNewGame(selectedPlayers, maxRounds);
    }
    return loadGameLocal(slug) || createNewGame(selectedPlayers, maxRounds);
  });

  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    saveGameLocal(slug, { ...game, updatedAt: new Date().toISOString() });
  }, [game, slug]);

  // ── Fonctions de jeu ──────────────────────────────────

  function startRound() {
    setGame((prev) => ({
      ...prev,
      phase: scoringType === 'bid_tricks' ? 'bidding' : 'scoring',
    }));
  }

  function finishBidding() {
    setGame((prev) => ({ ...prev, phase: 'scoring' }));
  }

  function updatePlayerRound(playerId, patch) {
    setGame((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.roundNumber !== prev.currentRound
          ? r
          : {
              ...r,
              playerData: r.playerData.map((pd) => (pd.playerId === playerId ? { ...pd, ...patch } : pd)),
            },
      ),
    }));
  }

  function finishRound() {
    setGame((prev) => {
      const updatedRounds = prev.rounds.map((r) =>
        r.roundNumber !== prev.currentRound ? r : { ...r, completed: true },
      );
      return { ...prev, rounds: updatedRounds, phase: 'review' };
    });
  }

  function nextRound() {
    setGame((prev) => {
      const next = prev.currentRound + 1;
      if (next > maxRounds) return { ...prev, phase: 'finished' };
      return {
        ...prev,
        currentRound: next,
        rounds: [...prev.rounds, createRoundData(prev.players, next)],
        phase: scoringType === 'bid_tricks' ? 'bidding' : 'scoring',
      };
    });
  }

  function endGame() {
    setGame((prev) => ({ ...prev, phase: 'finished' }));
    setConfirmEnd(false);
  }

  function newGame() {
    clearGameLocal(slug);
    setGame(createNewGame(selectedPlayers, maxRounds));
  }

  // ── Calculs de score ──────────────────────────────────

  const currentRound = game.rounds.find((r) => r.roundNumber === game.currentRound);

  const cumulativeScores = useMemo(() => {
    const totals = {};
    game.players.forEach((p) => (totals[p.id] = 0));
    for (const round of game.rounds.filter((r) => r.completed)) {
      for (const pd of round.playerData) {
        totals[pd.playerId] = (totals[pd.playerId] || 0) + computePlayerRoundScore(pd, round.roundNumber, scoringType);
      }
    }
    return totals;
  }, [game.rounds, game.players, scoringType]);

  const ranking = useMemo(() => {
    return Object.entries(cumulativeScores)
      .map(([id, score]) => ({ playerId: id, totalScore: score }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [cumulativeScores]);

  const getPlayerName = useCallback((id) => game.players.find((p) => p.id === id)?.name ?? id, [game.players]);
  const getPlayerAvatar = useCallback(
    (id) => {
      const p = game.players.find((pl) => pl.id === id);
      return p?.avatar ? getAvatarEmoji(p.avatar) : null;
    },
    [game.players],
  );

  // ── Rendu ─────────────────────────────────────────────

  const GameHeader = () => (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      <Typography variant="h1" color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        {gameConfig?.icon} {gameConfig?.name}
      </Typography>
    </Box>
  );

  // === SETUP / WAITING ===
  if (game.phase === 'setup') {
    return (
      <Fade in timeout={400}>
        <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
          <GameHeader />
          <Alert severity="info" sx={{ mb: 2 }}>
            {game.players.length} joueurs prêts — {maxRounds} {stepLabel.toLowerCase()}s
          </Alert>

          {/* Apercu joueurs */}
          <Stack spacing={1} sx={{ mb: 3 }}>
            {game.players.map((p) => (
              <Card key={p.id} sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    {getPlayerAvatar(p.id) || p.name[0].toUpperCase()}
                  </Box>
                  <Typography fontWeight={600}>{p.name}</Typography>
                </Stack>
              </Card>
            ))}
          </Stack>

          <Button variant="contained" fullWidth size="large" onClick={startRound} disabled={game.players.length < 2}>
            Commencer la Partie
          </Button>
        </Container>
      </Fade>
    );
  }

  // === BIDDING (bid_tricks only) ===
  if (game.phase === 'bidding' && currentRound) {
    return (
      <Fade in timeout={400}>
        <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
          <GameHeader />
          <Alert severity="info" sx={{ mb: 2 }}>
            {stepLabel} {game.currentRound}/{maxRounds} — Annonces
          </Alert>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {currentRound.playerData.map((pd, idx) => (
              <Grow in timeout={200 + idx * 80} key={pd.playerId}>
                <Card sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography fontWeight={600}>{getPlayerName(pd.playerId)}</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => updatePlayerRound(pd.playerId, { bid: Math.max(0, pd.bid - 1) })}
                        disabled={pd.bid <= 0}
                      >
                        <Remove />
                      </IconButton>
                      <Chip label={String(pd.bid)} color="primary" sx={{ minWidth: 48, fontSize: '1.1rem', fontWeight: 700 }} />
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => updatePlayerRound(pd.playerId, { bid: pd.bid + 1 })}
                      >
                        <Add />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Card>
              </Grow>
            ))}
          </Stack>
          <Button variant="contained" fullWidth size="large" onClick={finishBidding}>
            Valider les Annonces
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            startIcon={<Stop />}
            onClick={() => setConfirmEnd(true)}
          >
            Terminer la partie
          </Button>
          <ConfirmEndDialog open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={endGame} />
        </Container>
      </Fade>
    );
  }

  // === SCORING ===
  if (game.phase === 'scoring' && currentRound) {
    const totalTricks = scoringType === 'bid_tricks' ? currentRound.playerData.reduce((s, pd) => s + pd.tricks, 0) : 0;

    return (
      <Fade in timeout={400}>
        <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
          <GameHeader />
          <Alert severity="info" sx={{ mb: 2 }}>
            {stepLabel} {game.currentRound}/{maxRounds} — {scoringType === 'bid_tricks' ? 'Décompte' : 'Scores'}
          </Alert>

          <Stack spacing={2} sx={{ mb: 3 }}>
            {currentRound.playerData.map((pd, idx) => (
              <Grow in timeout={200 + idx * 80} key={pd.playerId}>
                <Card sx={{ p: 2 }}>
                  <Typography fontWeight={700} gutterBottom color="primary.main">
                    {getPlayerName(pd.playerId)}
                    {scoringType === 'bid_tricks' && (
                      <Chip label={`Annonce: ${pd.bid}`} size="small" sx={{ ml: 1 }} variant="outlined" />
                    )}
                  </Typography>

                  {/* Tricks (bid_tricks) */}
                  {scoringType === 'bid_tricks' && (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Typography variant="body2">Plis gagnes</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => updatePlayerRound(pd.playerId, { tricks: Math.max(0, pd.tricks - 1) })}
                          disabled={pd.tricks <= 0}
                        >
                          <Remove />
                        </IconButton>
                        <Chip label={String(pd.tricks)} sx={{ minWidth: 40, fontWeight: 700 }} />
                        <IconButton size="small" onClick={() => updatePlayerRound(pd.playerId, { tricks: pd.tricks + 1 })}>
                          <Add />
                        </IconButton>
                      </Stack>
                    </Stack>
                  )}

                  {/* Score simple (stepper) */}
                  {scoringType === 'simple' && (
                    <Box sx={{ mb: 1.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">Points — {stepLabel} {game.currentRound}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => updatePlayerRound(pd.playerId, { score: (pd.score || 0) - 1 })}
                          >
                            <Remove />
                          </IconButton>
                          <Chip
                            label={String(pd.score || 0)}
                            color={(pd.score || 0) >= 0 ? 'primary' : 'error'}
                            sx={{ minWidth: 56, fontSize: '1.1rem', fontWeight: 700 }}
                          />
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => updatePlayerRound(pd.playerId, { score: (pd.score || 0) + 1 })}
                          >
                            <Add />
                          </IconButton>
                        </Stack>
                      </Stack>
                      {/* Raccourcis +5 / +10 / -5 */}
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        {[-10, -5, -1, 1, 5, 10].map((v) => (
                          <Button
                            key={v}
                            size="small"
                            variant="outlined"
                            color={v > 0 ? 'success' : 'error'}
                            onClick={() => updatePlayerRound(pd.playerId, { score: (pd.score || 0) + v })}
                            sx={{ minWidth: 42, px: 0.5, fontSize: '0.75rem' }}
                          >
                            {v > 0 ? `+${v}` : v}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Bonus / Malus */}
                  {bonusValues.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, color: 'warning.main' }}>
                        Bonus / Malus
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {bonusValues.map((val) => (
                          <Button
                            key={val}
                            size="small"
                            variant="outlined"
                            color={val > 0 ? 'success' : 'error'}
                            onClick={() =>
                              updatePlayerRound(pd.playerId, { bonusMalusPoints: (pd.bonusMalusPoints || 0) + val })
                            }
                            sx={{ minWidth: 52 }}
                          >
                            {val > 0 ? `+${val}` : val}
                          </Button>
                        ))}
                        <Button
                          size="small"
                          variant="text"
                          color="warning"
                          onClick={() => updatePlayerRound(pd.playerId, { bonusMalusPoints: 0 })}
                        >
                          Reset
                        </Button>
                      </Stack>
                      {allowCustomBonus && (
                        <TextField
                          type="number"
                          size="small"
                          label="Bonus libre"
                          value={pd.customBonus || ''}
                          onChange={(e) => updatePlayerRound(pd.playerId, { customBonus: parseInt(e.target.value) || 0 })}
                          sx={{ mt: 1, width: 130 }}
                        />
                      )}
                      {((pd.bonusMalusPoints || 0) + (pd.customBonus || 0)) !== 0 && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.5,
                            fontWeight: 700,
                            color:
                              (pd.bonusMalusPoints || 0) + (pd.customBonus || 0) > 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          B/M : {(pd.bonusMalusPoints || 0) + (pd.customBonus || 0) > 0 ? '+' : ''}
                          {(pd.bonusMalusPoints || 0) + (pd.customBonus || 0)}
                        </Typography>
                      )}
                    </>
                  )}
                </Card>
              </Grow>
            ))}
          </Stack>

          <Button variant="contained" fullWidth size="large" onClick={finishRound}>
            Valider la {stepLabel}
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            startIcon={<Stop />}
            onClick={() => setConfirmEnd(true)}
          >
            Terminer la partie
          </Button>
          <ConfirmEndDialog open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={endGame} />
        </Container>
      </Fade>
    );
  }

  // === REVIEW ===
  if (game.phase === 'review' && currentRound) {
    return (
      <Fade in timeout={400}>
        <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
          <GameHeader />
          <Typography variant="h5" color="primary.main" gutterBottom textAlign="center" sx={{ animation: `${slideUp} 0.5s ease` }}>
            {stepLabel} {game.currentRound} — Résultats
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {currentRound.playerData
              .map((pd) => ({
                ...pd,
                roundScore: computePlayerRoundScore(pd, game.currentRound, scoringType),
              }))
              .sort((a, b) => b.roundScore - a.roundScore)
              .map((pd, idx) => (
                <Grow in timeout={300 + idx * 120} key={pd.playerId}>
                  <Card sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography fontWeight={700}>{getPlayerName(pd.playerId)}</Typography>
                        {scoringType === 'bid_tricks' && (
                          <Typography variant="body2" color="text.secondary">
                            Annonce: {pd.bid} | Plis: {pd.tricks}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          color: pd.roundScore >= 0 ? 'success.main' : 'error.main',
                          animation: `${scorePulse} 0.6s ease ${0.3 + idx * 0.1}s both`,
                        }}
                      >
                        {pd.roundScore >= 0 ? '+' : ''}
                        {pd.roundScore}
                      </Typography>
                    </Stack>
                  </Card>
                </Grow>
              ))}
          </Stack>

          {/* Classement cumulatif */}
          <ScoreBoard ranking={ranking} getPlayerName={getPlayerName} getPlayerAvatar={getPlayerAvatar} />

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" color="error" onClick={() => setConfirmEnd(true)} sx={{ flex: 1 }}>
              Terminer
            </Button>
            <Button variant="contained" onClick={nextRound} sx={{ flex: 2 }}>
              {game.currentRound >= maxRounds ? 'Classement Final' : `${stepLabel} ${game.currentRound + 1} \u2192`}
            </Button>
          </Stack>
          <ConfirmEndDialog open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={endGame} />
        </Container>
      </Fade>
    );
  }

  // === FINISHED ===
  return (
    <Fade in timeout={500}>
      <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
        <GameHeader />
        <Typography
          variant="h4"
          color="primary.main"
          textAlign="center"
          sx={{ mb: 3, animation: `${popIn} 0.7s ease` }}
        >
          Partie Terminée !
        </Typography>

        <ScoreBoard
          ranking={ranking}
          getPlayerName={getPlayerName}
          getPlayerAvatar={getPlayerAvatar}
          showMedals
        />

        <Stack spacing={2} sx={{ mt: 3, animation: `${slideUp} 0.6s ease 0.4s both` }}>
          <Button variant="contained" fullWidth size="large" onClick={newGame}>
            Nouvelle Partie
          </Button>
          <Button variant="outlined" fullWidth onClick={() => navigate(`/scores/${slug}`)}>
            Voir les Détails
          </Button>
        </Stack>
      </Container>
    </Fade>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  Sous-composants
// ═══════════════════════════════════════════════════════════════════════

function ConfirmEndDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Terminer la partie ?</DialogTitle>
      <DialogContent>
        <Typography>La partie sera arrêtée et le classement figé.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Terminer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ScoreBoard({ ranking, getPlayerName, getPlayerAvatar, showMedals = false }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <EmojiEvents color="primary" />
        <Typography variant="h6" color="primary.main">
          Classement
        </Typography>
      </Stack>
      <Stack spacing={1}>
        {ranking.map((entry, idx) => (
          <Stack
            key={entry.playerId}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: idx === 0 ? 'rgba(169,151,134,0.08)' : 'transparent',
              border: idx === 0 ? '1px solid rgba(169,151,134,0.2)' : '1px solid transparent',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography
                sx={{
                  width: 28,
                  textAlign: 'center',
                  fontSize: showMedals && idx < 3 ? '1.3rem' : '0.9rem',
                  fontWeight: 700,
                }}
              >
                {showMedals && idx < 3 ? medals[idx] : `${idx + 1}.`}
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: 'primary.contrastText',
                }}
              >
                {getPlayerAvatar(entry.playerId) || getPlayerName(entry.playerId)[0]}
              </Box>
              <Typography fontWeight={idx === 0 ? 700 : 500}>{getPlayerName(entry.playerId)}</Typography>
            </Stack>
            <Chip
              label={String(entry.totalScore)}
              color={entry.totalScore >= 0 ? 'primary' : 'error'}
              sx={{ fontWeight: 700, minWidth: 56, fontSize: '0.9rem' }}
            />
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════════

function createNewGame(players, maxRounds) {
  const gamePlayers = (players || []).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar }));
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    players: gamePlayers,
    rounds: gamePlayers.length >= 2 ? [createRoundData(gamePlayers, 1)] : [],
    currentRound: 1,
    phase: 'setup',
    startedAt: new Date().toISOString(),
  };
}

function createRoundData(players, roundNumber) {
  return {
    roundNumber,
    completed: false,
    playerData: players.map((p) => ({
      playerId: p.id,
      bid: 0,
      tricks: 0,
      score: 0,
      bonusMalusPoints: 0,
      customBonus: 0,
    })),
  };
}

/**
 * Calcule le score d'un joueur pour une manche.
 * Supporte les 2 modes : simple (score direct) et bid_tricks (annonce/plis).
 */
function computePlayerRoundScore(pd, roundNumber, scoringType) {
  const bm = (pd.bonusMalusPoints || 0) + (pd.customBonus || 0);

  if (scoringType === 'simple') {
    return (pd.score || 0) + bm;
  }

  // bid_tricks
  const { bid, tricks } = pd;
  const bidMet = tricks === bid;
  let base;
  if (bidMet) {
    base = bid > 0 ? 20 * bid : 10 * roundNumber;
  } else {
    base = bid === 0 ? -10 * roundNumber : -10 * Math.abs(tricks - bid);
  }
  return base + bm;
}

// Export pour les scores page
export { computePlayerRoundScore, storageKey };
