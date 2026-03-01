import { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { login, verify, resendCode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si le compte n'est pas verifie, on passe en mode verification
  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.body?.needsVerification) {
        setNeedsVerification(true);
        // Renvoyer un code automatiquement
        try {
          await resendCode(email);
          setSuccess('Un code de verification a ete envoye a ton email.');
        } catch {
          // ignore
        }
      } else {
        setError(err.message || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await verify(email, code.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      await resendCode(email);
      setSuccess('Nouveau code envoye !');
    } catch (err) {
      setError(err.message || 'Erreur lors du renvoi');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h4" color="primary.main" gutterBottom>
        Game Master
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        {needsVerification ? 'Verification email' : 'Connexion'}
      </Typography>
      <Card>
        <CardContent>
          {needsVerification ? (
            <form onSubmit={handleVerify}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <Typography variant="body2" color="text.secondary">
                  Ton compte n'est pas encore verifie. Entre le code envoye a <strong>{email}</strong>
                </Typography>
                <TextField
                  label="Code de verification"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  fullWidth
                  autoFocus
                  inputProps={{ maxLength: 8, style: { letterSpacing: '4px', textAlign: 'center', fontSize: '1.3rem' } }}
                  placeholder="ABCD1234"
                />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                  {loading ? 'Verification...' : 'Verifier'}
                </Button>
                <Button variant="text" size="small" onClick={handleResend} disabled={loading}>
                  Renvoyer le code
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                />
                <TextField
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
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
                  <Link to="/register" style={{ color: '#d4af37' }}>
                    Creer un compte
                  </Link>
                </Typography>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
