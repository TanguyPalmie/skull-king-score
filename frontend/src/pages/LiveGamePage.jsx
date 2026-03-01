import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  Stack,
  CircularProgress,
  Chip,
  Alert,
  Button,
  TextField,
  LinearProgress,
} from '@mui/material';
import { Refresh, Visibility } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getLiveGame } from '../api.js';
import { calculateRoundScore } from '../games/skull-king/scoring.js';

function LiveScoreboard({ game }) {
  if (!game.rounds || game.rounds.length === 0) return null;

  const totals = {};
  game.players.forEach((p) => {
    totals[p.id] = 0;
  });
  game.rounds
    .filter((r) => r.completed)
    .forEach((r) => {
      r.playerData.forEach((pd) => {
        const score = calculateRoundScore(pd, r.roundNumber);
        totals[pd.playerId] = (totals[pd.playerId] || 0) + score.totalRoundScore;
      });
    });

  const sorted = game.players
    .map((p) => ({ ...p, total: totals[p.id] || 0 }))
    .sort((a, b) => b.total - a.total);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom color="primary.main">
        Classement
      </Typography>
      <Stack spacing={1}>
        {sorted.map((player, idx) => (
          <Stack
            key={player.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: idx === 0 ? 'rgba(169,151,134,0.1)' : 'transparent',
            }}
          >
            <Typography fontWeight={600}>
              {medals[idx] || `${idx + 1}.`} {player.name}
            </Typography>
            <Typography fontWeight={700} color={player.total >= 0 ? 'success.main' : 'error.main'}>
              {player.total}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

function LiveRoundDetail({ game }) {
  const currentRound = game.rounds?.find((r) => r.roundNumber === game.currentRound);
  if (!currentRound) return null;

  return (
    <Card sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom color="primary.main">
        Manche {game.currentRound} — {game.phase === 'bidding' ? 'Annonces' : game.phase === 'review' ? 'Resultats' : 'En cours'}
      </Typography>
      <Stack spacing={1}>
        {currentRound.playerData.map((pd) => {
          const player = game.players.find((p) => p.id === pd.playerId);
          const score = currentRound.completed ? calculateRoundScore(pd, game.currentRound) : null;
          return (
            <Stack key={pd.playerId} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 0.5 }}>
              <Box>
                <Typography fontWeight={600}>{player?.name || '?'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Annonce: {pd.bid} | Plis: {pd.tricks}
                </Typography>
              </Box>
              {score && (
                <Typography fontWeight={700} color={score.totalRoundScore >= 0 ? 'success.main' : 'error.main'}>
                  {score.totalRoundScore >= 0 ? '+' : ''}{score.totalRoundScore}
                </Typography>
              )}
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}

export default function LiveGamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [liveGame, setLiveGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchGame = useCallback(async (shareCode) => {
    setLoading(true);
    setError('');
    try {
      const data = await getLiveGame(shareCode);
      setLiveGame(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || 'Partie introuvable');
      setLiveGame(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (code) {
      fetchGame(code);
      // Auto-refresh toutes les 10 secondes
      const interval = setInterval(() => fetchGame(code), 10000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [code, fetchGame]);

  // Page de saisie de code si pas de code dans l'URL
  if (!code) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h1" color="primary.main" gutterBottom>
          Suivre une Partie
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Entrez le code de partage pour suivre une partie en cours.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            label="Code de partage"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            fullWidth
            inputProps={{ maxLength: 6, style: { letterSpacing: 4, fontWeight: 700, textAlign: 'center' } }}
          />
          <Button
            variant="contained"
            onClick={() => inputCode.trim() && navigate(`/live/${inputCode.trim()}`)}
            disabled={!inputCode.trim()}
          >
            Suivre
          </Button>
        </Stack>
      </Container>
    );
  }

  if (loading && !liveGame) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={() => navigate('/live')}>Essayer un autre code</Button>
      </Container>
    );
  }

  const gameState = liveGame?.state || {};
  const phaseLabels = {
    setup: 'Preparation',
    bidding: 'Annonces',
    scoring: 'Decompte',
    review: 'Resultats',
    finished: 'Terminee',
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" color="primary.main" fontWeight={700}>
            <Visibility sx={{ mr: 1, verticalAlign: 'middle' }} />
            Partie Live
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Par {liveGame.owner_pseudo} — Code: {liveGame.share_code}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={() => fetchGame(code)}
        >
          Refresh
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip
          label={gameState.game_slug || liveGame.game_slug || 'Jeu'}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`Manche ${gameState.currentRound || '?'}`}
          color="info"
        />
        <Chip
          label={phaseLabels[gameState.phase] || gameState.phase}
          color={gameState.phase === 'finished' ? 'error' : 'success'}
        />
        {!liveGame.active && <Chip label="Terminee" color="error" />}
      </Stack>

      {lastRefresh && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Derniere maj : {lastRefresh.toLocaleTimeString()}
        </Typography>
      )}

      {gameState.players && gameState.rounds && (
        <>
          <LiveScoreboard game={gameState} />
          <LiveRoundDetail game={gameState} />
        </>
      )}
    </Container>
  );
}
