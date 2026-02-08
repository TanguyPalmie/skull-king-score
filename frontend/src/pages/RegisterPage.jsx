import { useState } from 'react';
import { Container, Typography, TextField, Button, Card, CardContent, Stack, Alert } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h4" color="primary.main" gutterBottom>
        ☠️ Skull King
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Créer un compte
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required fullWidth autoFocus
              />
              <TextField
                label="Mot de passe" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required fullWidth helperText="Minimum 6 caractères"
              />
              <TextField
                label="Confirmer le mot de passe" type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required fullWidth
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Déjà un compte ?{' '}
                <Link to="/login" style={{ color: '#d4af37' }}>Se connecter</Link>
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
