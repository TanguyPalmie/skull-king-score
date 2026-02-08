import { useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Container, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { loadGameLocal } from '../storage/localStorage.js';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const savedGame = loadGameLocal();
  const hasGame = savedGame && savedGame.phase !== 'finished';

  return (
    <Container maxWidth="sm" sx={{ py: 3, textAlign: 'center' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem' }, color: 'primary.main', mb: 1 }}>
          ☠️ Skull King
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: 'text.secondary', mb: 1 }}>
          Game Master
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary">
            Connecté : {user.email}
          </Typography>
        )}
      </Box>

      <Typography variant="body1" color="text.primary" sx={{ mb: 4 }}>
        Compteur de points et assistant pour le jeu de cartes Skull King. Gérez vos parties, calculez les scores et consultez les règles !
      </Typography>

      <Stack spacing={2} sx={{ mb: 4 }}>
        <Button variant="contained" size="large" fullWidth onClick={() => navigate('/game', { state: { newGame: true } })}
          sx={{ py: 1.5, fontSize: '1.1rem' }}>
          🏴‍☠️ Nouvelle Partie
        </Button>
        {hasGame && (
          <Button variant="outlined" size="large" fullWidth onClick={() => navigate('/game')}
            sx={{ py: 1.5, fontSize: '1.1rem', borderColor: 'primary.main', color: 'primary.main' }}>
            ▶️ Reprendre la Partie
          </Button>
        )}
        {user && (
          <Button variant="text" color="error" onClick={logout} size="small">
            Déconnexion
          </Button>
        )}
      </Stack>

      <Card sx={{ textAlign: 'left' }}>
        <CardContent>
          <Typography variant="h6" color="primary.main" gutterBottom>Fonctionnalités</Typography>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>2 à 12 joueurs</li>
            <li>Profils joueurs avec photo</li>
            <li>Calcul automatique des scores</li>
            <li>Bonus : Skull King, Sirènes, Pirates</li>
            <li>Cartes spéciales : Baleine Blanche, Butin</li>
            <li>Classement en temps réel</li>
            <li>Chatbot intégré pour les règles</li>
            <li>Sauvegarde locale + cloud</li>
          </ul>
        </CardContent>
      </Card>
    </Container>
  );
}
