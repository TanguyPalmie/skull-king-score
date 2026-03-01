import { Box, Typography, Button, Container, Card, CardContent, Stack, Avatar, Chip, Fade, Grow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import { getAvailableGames } from '../games/registry.jsx';
import { getSelectedProfiles, getProfiles } from '../storage/profileStorage.js';
import { getAvatarEmoji } from '../data/pirateAvatars.js';

const slideUp = keyframes`
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export default function NewGamePage() {
  const navigate = useNavigate();
  const games = getAvailableGames();
  const selectedIds = getSelectedProfiles();
  const allProfiles = getProfiles();
  const selectedPlayers = allProfiles.filter((p) => selectedIds.includes(p.id));

  if (selectedPlayers.length < 2) {
    return (
      <Fade in timeout={400}>
        <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="primary.main" gutterBottom>
            Selectionnez des joueurs
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Retournez a l&apos;ecran d&apos;accueil pour selectionner au moins 2 joueurs.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Retour
          </Button>
        </Container>
      </Fade>
    );
  }

  return (
    <Fade in timeout={400}>
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box sx={{ mb: 3, animation: `${slideUp} 0.5s ease` }}>
          <Typography variant="h5" color="primary.main" gutterBottom>
            Choisir un jeu
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
            {selectedPlayers.map((p) => (
              <Chip
                key={p.id}
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: '0.9rem' }}>
                    {getAvatarEmoji(p.avatar)}
                  </Avatar>
                }
                label={p.name}
                variant="outlined"
                color="primary"
                size="small"
              />
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {selectedPlayers.length} joueurs selectionnes
          </Typography>
        </Box>

        <Stack spacing={2}>
          {games.map((game, idx) => {
            const enoughPlayers =
              selectedPlayers.length >= game.minPlayers && selectedPlayers.length <= game.maxPlayers;

            return (
              <Grow in timeout={300 + idx * 150} key={game.id}>
                <Card
                  sx={{
                    overflow: 'hidden',
                    border: '1px solid rgba(169,151,134,0.3)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(169,151,134,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          fontSize: '2rem',
                          bgcolor: game.color || 'primary.main',
                          color: '#1a1a2e',
                        }}
                      >
                        {game.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={700}>
                          {game.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {game.minPlayers}-{game.maxPlayers} joueurs
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {game.description}
                    </Typography>
                    {!enoughPlayers && (
                      <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 1 }}>
                        Ce jeu necessite entre {game.minPlayers} et {game.maxPlayers} joueurs.
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={!enoughPlayers}
                      onClick={() => navigate(`/game/${game.id}`, { state: { newGame: true } })}
                      sx={{ py: 1.2 }}
                    >
                      Nouvelle Partie
                    </Button>
                  </CardContent>
                </Card>
              </Grow>
            );
          })}
        </Stack>

        <Button variant="text" onClick={() => navigate('/')} sx={{ mt: 3, display: 'block', mx: 'auto' }}>
          Retour aux profils
        </Button>
      </Container>
    </Fade>
  );
}
