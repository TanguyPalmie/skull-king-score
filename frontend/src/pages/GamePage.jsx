import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Container, Stepper, Step, StepLabel, Card,
  TextField, IconButton, Avatar, Stack, Chip, Switch, FormControlLabel,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { Add, Remove, Delete, PhotoCamera } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveGameLocal, loadGameLocal, clearGameLocal, loadSettingsLocal, generateId } from '../storage/localStorage.js';
import { calculateRoundScore } from '../engine/scoring.js';
import Scoreboard from '../components/Scoreboard.jsx';

const STEPS = ['Inscription', 'Annonces', 'Plis & Bonus', 'Résultats'];

function phaseToStep(phase) {
  switch (phase) {
    case 'setup': return 0;
    case 'bidding': return 1;
    case 'playing': case 'scoring': return 2;
    case 'review': case 'finished': return 3;
    default: return 0;
  }
}

function createEmptyGame() {
  return { id: generateId(), players: [], rounds: [], currentRound: 1, phase: 'setup', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function createRoundData(players, roundNumber) {
  return {
    roundNumber, completed: false,
    playerData: players.map((p) => ({ playerId: p.id, bid: 0, tricks: 0, piratesCaptured: 0, mermaidDefeatsSkullKing: false, whiteWhalePlayed: false, lootPoints: 0 })),
  };
}

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.state?.newGame === true;
  const settings = loadSettingsLocal();

  const [game, setGame] = useState(() => {
    if (isNew) { clearGameLocal(); return createEmptyGame(); }
    return loadGameLocal() || createEmptyGame();
  });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => { saveGameLocal({ ...game, updatedAt: new Date().toISOString() }); }, [game]);
  useEffect(() => { if (isNew) window.history.replaceState({}, ''); }, [isNew]);

  const updateGame = useCallback((patch) => setGame((prev) => ({ ...prev, ...patch })), []);
  const currentRound = game.rounds.find((r) => r.roundNumber === game.currentRound);
  const updatePD = useCallback((playerId, patch) => {
    setGame((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.roundNumber !== prev.currentRound ? r : { ...r, playerData: r.playerData.map((pd) => pd.playerId === playerId ? { ...pd, ...patch } : pd) }
      ),
    }));
  }, []);
  const getPlayerName = useCallback((id) => game.players.find((p) => p.id === id)?.name ?? id, [game.players]);

  const addPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name || game.players.length >= 12) return;
    updateGame({ players: [...game.players, { id: generateId(), name }] });
    setNewPlayerName('');
  }, [newPlayerName, game.players, updateGame]);

  const removePlayer = useCallback((id) => updateGame({ players: game.players.filter((p) => p.id !== id) }), [game.players, updateGame]);

  const handlePhotoUpload = useCallback((playerId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateGame({ players: game.players.map((p) => p.id === playerId ? { ...p, photo: reader.result } : p) });
    reader.readAsDataURL(file);
  }, [game.players, updateGame]);

  // Phase transitions
  const startGame = useCallback(() => { if (game.players.length < 2) return; updateGame({ phase: 'bidding', rounds: [createRoundData(game.players, 1)], currentRound: 1 }); }, [game.players, updateGame]);
  const finishBidding = useCallback(() => updateGame({ phase: 'scoring' }), [updateGame]);
  const finishScoring = useCallback(() => setGame((prev) => ({ ...prev, rounds: prev.rounds.map((r) => r.roundNumber !== prev.currentRound ? r : { ...r, completed: true }), phase: 'review' })), []);
  const nextRound = useCallback(() => setGame((prev) => {
    const next = prev.currentRound + 1;
    if (next > settings.maxRounds) return { ...prev, phase: 'finished' };
    return { ...prev, rounds: [...prev.rounds, createRoundData(prev.players, next)], currentRound: next, phase: 'bidding' };
  }), [settings.maxRounds]);
  const endGame = useCallback(() => { updateGame({ phase: 'finished' }); setConfirmEnd(false); }, [updateGame]);
  const newGame = useCallback(() => { clearGameLocal(); setGame(createEmptyGame()); }, []);

  // === SETUP ===
  if (game.phase === 'setup') return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h5" gutterBottom color="primary.main">Inscription des joueurs</Typography>
      <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">{game.players.length}/12 joueurs (minimum 2)</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField label="Nom du joueur" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addPlayer(); }} size="small" fullWidth />
        <Button variant="contained" onClick={addPlayer} disabled={!newPlayerName.trim() || game.players.length >= 12}>Ajouter</Button>
      </Stack>
      <Stack spacing={1} sx={{ mb: 3 }}>
        {game.players.map((player) => (
          <Card key={player.id} sx={{ p: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1 }}>
              <Avatar src={player.photo} sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                {player.name[0].toUpperCase()}
              </Avatar>
              <Typography sx={{ flex: 1 }}>{player.name}</Typography>
              <label style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <IconButton size="small" color="primary" component="span"><PhotoCamera fontSize="small" /></IconButton>
                <input type="file" accept="image/*" capture="environment" hidden onChange={(ev) => handlePhotoUpload(player.id, ev)} />
              </label>
              <IconButton size="small" color="error" onClick={() => removePlayer(player.id)}><Delete fontSize="small" /></IconButton>
            </Stack>
          </Card>
        ))}
      </Stack>
      <Button variant="contained" fullWidth size="large" onClick={startGame} disabled={game.players.length < 2}>
        Commencer la Partie
      </Button>
    </Container>
  );

  // === BIDDING ===
  if (game.phase === 'bidding' && currentRound) return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Stepper activeStep={phaseToStep('bidding')} alternativeLabel sx={{ mb: 2, '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>
        {STEPS.map((l) => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
      </Stepper>
      <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(212,175,55,0.1)', color: 'text.primary' }}>
        Manche {game.currentRound}/{settings.maxRounds} — Annonces
      </Alert>
      <Typography variant="h5" gutterBottom color="primary.main">Manche {game.currentRound} — Annonces</Typography>
      <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
        Chaque joueur annonce combien de plis il pense gagner (0 à {game.currentRound}).
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {currentRound.playerData.map((pd) => (
          <Card key={pd.playerId} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography fontWeight={600}>{getPlayerName(pd.playerId)}</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" color="primary" onClick={() => updatePD(pd.playerId, { bid: Math.max(0, pd.bid - 1) })} disabled={pd.bid <= 0}><Remove /></IconButton>
                <Chip label={String(pd.bid)} color="primary" sx={{ minWidth: 48, fontSize: '1.1rem', fontWeight: 700 }} />
                <IconButton size="small" color="primary" onClick={() => updatePD(pd.playerId, { bid: Math.min(game.currentRound, pd.bid + 1) })} disabled={pd.bid >= game.currentRound}><Add /></IconButton>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>
      <Button variant="contained" fullWidth size="large" onClick={finishBidding}>Valider les Annonces</Button>
    </Container>
  );

  // === SCORING ===
  if ((game.phase === 'scoring' || game.phase === 'playing') && currentRound) return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Stepper activeStep={phaseToStep('scoring')} alternativeLabel sx={{ mb: 2, '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>
        {STEPS.map((l) => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
      </Stepper>
      <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(212,175,55,0.1)', color: 'text.primary' }}>
        Manche {game.currentRound}/{settings.maxRounds} — Décompte
      </Alert>
      <Typography variant="h5" gutterBottom color="primary.main">Manche {game.currentRound} — Décompte</Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {currentRound.playerData.map((pd) => (
          <Card key={pd.playerId} sx={{ p: 2 }}>
            <Typography fontWeight={700} gutterBottom color="primary.main">{getPlayerName(pd.playerId)} (annonce : {pd.bid})</Typography>
            {/* Tricks */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="body2">Plis gagnés</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={() => updatePD(pd.playerId, { tricks: Math.max(0, pd.tricks - 1) })} disabled={pd.tricks <= 0}><Remove /></IconButton>
                <Chip label={String(pd.tricks)} sx={{ minWidth: 40 }} />
                <IconButton size="small" onClick={() => updatePD(pd.playerId, { tricks: pd.tricks + 1 })}><Add /></IconButton>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }} />
            {/* Pirates */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2">Pirates capturés par SK</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={() => updatePD(pd.playerId, { piratesCaptured: Math.max(0, pd.piratesCaptured - 1) })} disabled={pd.piratesCaptured <= 0}><Remove /></IconButton>
                <Chip label={String(pd.piratesCaptured)} sx={{ minWidth: 40 }} />
                <IconButton size="small" onClick={() => updatePD(pd.playerId, { piratesCaptured: pd.piratesCaptured + 1 })}><Add /></IconButton>
              </Stack>
            </Stack>
            <FormControlLabel control={<Switch checked={pd.mermaidDefeatsSkullKing} onChange={(_, c) => updatePD(pd.playerId, { mermaidDefeatsSkullKing: c })} color="primary" />} label="Sirène bat le Skull King (+50)" sx={{ mb: 0.5 }} />
            <FormControlLabel control={<Switch checked={pd.whiteWhalePlayed} onChange={(_, c) => updatePD(pd.playerId, { whiteWhalePlayed: c })} color="warning" />} label="Baleine Blanche jouée" />
            {settings.lootEnabled && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Points de Butin</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {settings.lootValues.map((val) => (
                    <Button key={val} size="small" variant="outlined" onClick={() => updatePD(pd.playerId, { lootPoints: pd.lootPoints + val })} sx={{ minWidth: 60 }}>
                      {val > 0 ? `+${val}` : String(val)}
                    </Button>
                  ))}
                  <Button size="small" variant="text" color="error" onClick={() => updatePD(pd.playerId, { lootPoints: 0 })}>Reset</Button>
                </Stack>
                {pd.lootPoints !== 0 && (
                  <Typography variant="body2" sx={{ mt: 0.5, color: pd.lootPoints > 0 ? 'success.main' : 'error.main' }}>
                    Butin : {pd.lootPoints > 0 ? '+' : ''}{pd.lootPoints}
                  </Typography>
                )}
              </Box>
            )}
          </Card>
        ))}
      </Stack>
      <Button variant="contained" fullWidth size="large" onClick={finishScoring}>Calculer les Scores</Button>
    </Container>
  );

  // === REVIEW ===
  if (game.phase === 'review' && currentRound) return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Stepper activeStep={3} alternativeLabel sx={{ mb: 2, '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>
        {STEPS.map((l) => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
      </Stepper>
      <Typography variant="h5" gutterBottom color="primary.main">Manche {game.currentRound} — Résultats</Typography>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {currentRound.playerData.map((pd) => {
          const score = calculateRoundScore(pd, game.currentRound);
          return (
            <Card key={pd.playerId} sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={700}>{getPlayerName(pd.playerId)}</Typography>
                  <Typography variant="body2" color="text.secondary">Annonce : {pd.bid} | Plis : {pd.tricks}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" color={score.totalRoundScore >= 0 ? 'success.main' : 'error.main'} fontWeight={700}>
                    {score.totalRoundScore >= 0 ? '+' : ''}{score.totalRoundScore}
                  </Typography>
                  {score.bonusScore > 0 && <Typography variant="caption" color="warning.main">Bonus : +{score.bonusScore}</Typography>}
                  {score.lootScore !== 0 && <Typography variant="caption" color="text.secondary"> Butin : {score.lootScore > 0 ? '+' : ''}{score.lootScore}</Typography>}
                </Box>
              </Stack>
            </Card>
          );
        })}
      </Stack>
      <Scoreboard game={game} />
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button variant="outlined" color="error" onClick={() => setConfirmEnd(true)} sx={{ flex: 1 }}>Terminer</Button>
        <Button variant="contained" onClick={nextRound} sx={{ flex: 2 }}>
          {game.currentRound >= settings.maxRounds ? 'Voir le Classement Final' : `Manche ${game.currentRound + 1} →`}
        </Button>
      </Stack>
      <Dialog open={confirmEnd} onClose={() => setConfirmEnd(false)}>
        <DialogTitle>Terminer la partie ?</DialogTitle>
        <DialogContent><Typography>Voulez-vous vraiment terminer la partie en cours ?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEnd(false)}>Annuler</Button>
          <Button onClick={endGame} color="error" variant="contained">Terminer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  // === FINISHED ===
  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h4" gutterBottom color="primary.main" textAlign="center">🏆 Partie Terminée !</Typography>
      <Scoreboard game={game} />
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Button variant="contained" fullWidth size="large" onClick={newGame}>🏴‍☠️ Nouvelle Partie</Button>
        <Button variant="outlined" fullWidth onClick={() => navigate('/scores')}>Voir les Détails</Button>
      </Stack>
    </Container>
  );
}
