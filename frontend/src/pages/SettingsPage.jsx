import { Typography, Container, Card, CardContent, Button, Stack } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext.jsx';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h1" color="primary.main" gutterBottom textAlign="center">
        Reglages
      </Typography>

      {/* Compte */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Mon Compte
          </Typography>
          {user && (
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Pseudo :</strong> {user.pseudo}
              </Typography>
              <Typography variant="body2">
                <strong>Email :</strong> {user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role : {user.role === 'admin' ? 'Administrateur' : 'Joueur'}
              </Typography>
            </Stack>
          )}
          <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={logout} fullWidth>
            Se deconnecter
          </Button>
        </CardContent>
      </Card>

      {/* A propos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            A Propos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Game Master v2.0.0 — Compteur de points multi-jeux
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fonctionne entierement hors-ligne (scores locaux).
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
