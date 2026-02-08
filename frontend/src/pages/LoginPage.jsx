import { useState } from 'react';
import { Container, Typography, TextField, Button, Card, CardContent, Stack, Alert, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
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
        Connexion
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
                label="Mot de passe" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                required fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Pas encore de compte ?{' '}
                <Link to="/register" style={{ color: '#d4af37' }}>Créer un compte</Link>
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
