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

export default function RegisterPage() {
  const { register, verify, resendCode } = useAuth();
  const navigate = useNavigate();

  // Step 1: form, Step 2: code verification
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (pseudo.trim().length < 2) {
      setError('Le pseudo doit contenir au moins 2 caracteres.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(email, pseudo.trim(), password);
      setStep(2);
      setSuccess('Code envoye ! Verifie ta boite mail.');
    } catch (err) {
      setError(err.message || 'Erreur lors de la creation du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (code.trim().length !== 8) {
      setError('Le code doit contenir 8 caracteres.');
      return;
    }
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
        {step === 1 ? 'Creer un compte' : 'Verification email'}
      </Typography>
      <Card>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRegister}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="Pseudo"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                  helperText="Visible par tes amis"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  helperText="Minimum 6 caracteres"
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
                  {loading ? 'Creation...' : 'Creer mon compte'}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Deja un compte ?{' '}
                  <Link to="/login" style={{ color: '#d4af37' }}>
                    Se connecter
                  </Link>
                </Typography>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <Typography variant="body2" color="text.secondary">
                  Un code de 8 caracteres a ete envoye a <strong>{email}</strong>
                </Typography>
                <TextField
                  label="Code de verification"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  fullWidth
                  autoFocus
                  inputProps={{
                    maxLength: 8,
                    style: { letterSpacing: '4px', textAlign: 'center', fontSize: '1.3rem' },
                  }}
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
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
