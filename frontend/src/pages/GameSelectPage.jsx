import { useState } from 'react';
import {
  Box, Typography, Button, Container, Card, CardContent, Stack, Avatar, Chip, Fade, Grow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { PlayArrow, Stop, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import { getAvailableGames } from '../games/registry.jsx';

const slideUp = keyframes`
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

function getOngoingGames() {
  const games = getAvailableGames();
  const ongoing = [];
  for (const game of games) {
    try {
      const raw = localStorage.getItem(`gamemaster-${game.id}-game`);
      if (!raw) continue;
      const state = JSON.parse(raw);
      if (state && state.phase && state.phase !== 'setup' && state.phase !== 'finished') {
        ongoing.push({ game, state });
      }
    } catch {
      // skip
    }
  }
  return ongoing;
}

export default function GameSelectPage() {
  const navigate = useNavigate();
  const [ongoingGames, setOngoingGames] = useState(getOngoingGames);
  const [confirmEnd, setConfirmEnd] = useState(null);

  const handleEndGame = (gameId) => {
    localStorage.removeItem(`gamemaster-${gameId}-game`);
    setOngoingGames(getOngoingGames());
    setConfirmEnd(null);
  };

  return (
    <Fade in timeout={400}>
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box sx={{ mb: 3, textAlign: 'center', animation: `${slideUp} 0.5s ease` }}>
          <Typography variant="h5" color="primary.main" gutterBottom>
            Parties en cours
          </Typography>
        </Box>

        {ongoingGames.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Aucune partie en cours
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selectionnez des joueurs puis lancez une partie !
            </Typography>
          </Card>
        ) : (
          <Stack spacing={2}>
            {ongoingGames.map(({ game, state }, idx) => (
              <Grow in timeout={200 + idx * 100} key={game.id}>
                <Card
                  sx={{
                    overflow: 'hidden',
                    border: '1px solid rgba(169,151,134,0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          fontSize: '1.5rem',
                          bgcolor: game.color || 'primary.main',
                          color: '#1a1a2e',
                        }}
                      >
                        {game.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                          {game.name}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label={`Manche ${state.currentRound}`} size="small" color="info" />
                          <Chip label={`${state.players?.length || 0} joueurs`} size="small" variant="outlined" />
                        </Stack>
                      </Box>
                    </Stack>

                    {state.players && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {state.players.map((p) => (
                          <Chip key={p.id} label={p.name} size="small" variant="outlined" color="primary" />
                        ))}
                      </Stack>
                    )}

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<PlayArrow />}
                        onClick={() => navigate(`/game/${game.id}`)}
                        sx={{ flex: 1 }}
                      >
                        Reprendre
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setConfirmEnd(game)}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        Terminer
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grow>
            ))}
          </Stack>
        )}

        {/* Dialog confirmation suppression */}
        <Dialog open={!!confirmEnd} onClose={() => setConfirmEnd(null)}>
          <DialogTitle>Terminer cette partie ?</DialogTitle>
          <DialogContent>
            <Typography>
              Voulez-vous terminer la partie <strong>{confirmEnd?.name}</strong> en cours ? Cette action est irreversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmEnd(null)}>Annuler</Button>
            <Button onClick={() => handleEndGame(confirmEnd.id)} color="error" variant="contained">
              Terminer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Fade>
  );
}
