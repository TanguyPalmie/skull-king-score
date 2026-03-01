import { Typography, Container, Card, CardContent, Stack, Avatar, Fade, Grow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import { getAvailableGames } from '../games/registry.jsx';

const slideUp = keyframes`
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export default function ScoresIndexPage() {
  const navigate = useNavigate();
  const games = getAvailableGames();

  return (
    <Fade in timeout={400}>
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Typography
          variant="h5"
          color="primary.main"
          gutterBottom
          textAlign="center"
          sx={{ animation: `${slideUp} 0.5s ease` }}
        >
          Scores
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Selectionnez un jeu pour voir les scores
        </Typography>

        <Stack spacing={1.5}>
          {games.map((game, idx) => (
            <Grow in timeout={200 + idx * 100} key={game.id}>
              <Card
                onClick={() => navigate(`/scores/${game.id}`)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: (t) => `0 6px 16px ${t.palette.primary.main}22`,
                  },
                  '&:active': { transform: 'scale(0.98)' },
                }}
              >
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
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
                    <Typography variant="h6" fontWeight={600}>
                      {game.name}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grow>
          ))}
        </Stack>
      </Container>
    </Fade>
  );
}
