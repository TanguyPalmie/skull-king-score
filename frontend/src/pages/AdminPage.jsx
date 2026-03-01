import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import * as api from '../api.js';

const EMPTY_GAME = {
  slug: '',
  name: '',
  icon: '',
  description: '',
  min_players: 2,
  max_players: 12,
  default_rounds: 10,
  scoring_type: 'simple',
  bonus_values: [],
  allow_custom_bonus: false,
  theme_config: { primary: '#d4af37' },
  enabled: true,
};

const BONUS_PRESETS = [-10, -5, 5, 10];

export default function AdminPage() {
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editGame, setEditGame] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [g, u] = await Promise.all([api.adminGetGames(), api.adminGetUsers()]);
      setGames(g);
      setUsers(u);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openNew = () => {
    setEditGame({ ...EMPTY_GAME });
    setDialogOpen(true);
  };

  const openEdit = (game) => {
    setEditGame({
      ...game,
      bonus_values: game.bonus_values || [],
      theme_config: game.theme_config || { primary: '#d4af37' },
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      if (editGame.id) {
        await api.adminUpdateGame(editGame.slug, editGame);
        setSuccess('Jeu mis a jour');
      } else {
        if (!editGame.slug || !editGame.name) {
          setError('Slug et nom requis');
          return;
        }
        await api.adminCreateGame(editGame);
        setSuccess('Jeu cree');
      }
      setDialogOpen(false);
      setEditGame(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (slug) => {
    if (!confirm(`Supprimer le jeu "${slug}" ?`)) return;
    try {
      await api.adminDeleteGame(slug);
      setSuccess('Jeu supprime');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleBonus = (value) => {
    if (!editGame) return;
    const current = editGame.bonus_values || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value].sort((a, b) => a - b);
    setEditGame({ ...editGame, bonus_values: next });
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h1" color="primary.main" sx={{ mb: 3, textAlign: 'center' }}>
        Administration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Section Jeux */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h2" color="primary.main">
            Jeux ({games.length})
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            Nouveau jeu
          </Button>
        </Stack>

        <Stack spacing={2}>
          {games.map((game) => (
            <Card key={game.slug}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4">
                      {game.icon} {game.name}
                      {!game.enabled && (
                        <Chip label="Desactive" size="small" color="warning" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {game.slug} — {game.scoring_type === 'bid_tricks' ? 'Annonces + Plis' : 'Compteur simple'} —{' '}
                      {game.min_players}-{game.max_players} joueurs — {game.default_rounds} manches
                    </Typography>
                    {game.bonus_values?.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                        {game.bonus_values.map((v) => (
                          <Chip
                            key={v}
                            label={v > 0 ? `+${v}` : v}
                            size="small"
                            color={v > 0 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton onClick={() => openEdit(game)} color="primary">
                      <EditIcon />
                    </IconButton>
                    {game.slug !== 'skull-king' && (
                      <IconButton onClick={() => handleDelete(game.slug)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Section Utilisateurs */}
      <Box>
        <Typography variant="h2" color="primary.main" sx={{ mb: 2 }}>
          Utilisateurs ({users.length})
        </Typography>
        <Stack spacing={1}>
          {users.map((u) => (
            <Card key={u.id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {u.pseudo}
                      {u.role === 'admin' && (
                        <Chip label="Admin" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {u.email}
                    </Typography>
                  </Box>
                  <Chip
                    label={u.verified ? 'Verifie' : 'Non verifie'}
                    size="small"
                    color={u.verified ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Dialog edition jeu */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editGame?.id ? 'Modifier le jeu' : 'Nouveau jeu'}</DialogTitle>
        <DialogContent>
          {editGame && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Slug (identifiant unique)"
                value={editGame.slug}
                onChange={(e) => setEditGame({ ...editGame, slug: e.target.value })}
                disabled={!!editGame.id}
                fullWidth
                helperText="Utilise dans les URLs, pas modifiable apres creation"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Nom"
                  value={editGame.name}
                  onChange={(e) => setEditGame({ ...editGame, name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Icone"
                  value={editGame.icon}
                  onChange={(e) => setEditGame({ ...editGame, icon: e.target.value })}
                  sx={{ width: 100 }}
                  inputProps={{ style: { fontSize: '1.5rem', textAlign: 'center' } }}
                />
              </Stack>
              <TextField
                label="Description"
                value={editGame.description}
                onChange={(e) => setEditGame({ ...editGame, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Min joueurs"
                  type="number"
                  value={editGame.min_players}
                  onChange={(e) => setEditGame({ ...editGame, min_players: parseInt(e.target.value) || 2 })}
                  sx={{ width: 120 }}
                />
                <TextField
                  label="Max joueurs"
                  type="number"
                  value={editGame.max_players}
                  onChange={(e) => setEditGame({ ...editGame, max_players: parseInt(e.target.value) || 12 })}
                  sx={{ width: 120 }}
                />
                <TextField
                  label="Manches"
                  type="number"
                  value={editGame.default_rounds}
                  onChange={(e) => setEditGame({ ...editGame, default_rounds: parseInt(e.target.value) || 10 })}
                  sx={{ width: 120 }}
                />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Type de scoring</InputLabel>
                <Select
                  value={editGame.scoring_type}
                  label="Type de scoring"
                  onChange={(e) => setEditGame({ ...editGame, scoring_type: e.target.value })}
                >
                  <MenuItem value="simple">Compteur simple (+/-)</MenuItem>
                  <MenuItem value="bid_tricks">Annonces + Plis (Skull King)</MenuItem>
                </Select>
              </FormControl>

              {/* Bonus/Malus */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Bonus / Malus disponibles :
                </Typography>
                <Stack direction="row" spacing={1}>
                  {BONUS_PRESETS.map((v) => (
                    <Chip
                      key={v}
                      label={v > 0 ? `+${v}` : v}
                      color={(editGame.bonus_values || []).includes(v) ? (v > 0 ? 'success' : 'error') : 'default'}
                      variant={(editGame.bonus_values || []).includes(v) ? 'filled' : 'outlined'}
                      onClick={() => toggleBonus(v)}
                    />
                  ))}
                </Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editGame.allow_custom_bonus}
                      onChange={(e) => setEditGame({ ...editGame, allow_custom_bonus: e.target.checked })}
                    />
                  }
                  label="Autoriser valeur libre"
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* Couleur primaire */}
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Couleur primaire"
                  value={editGame.theme_config?.primary || '#d4af37'}
                  onChange={(e) =>
                    setEditGame({
                      ...editGame,
                      theme_config: { ...editGame.theme_config, primary: e.target.value },
                    })
                  }
                  sx={{ width: 160 }}
                />
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: editGame.theme_config?.primary || '#d4af37',
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={editGame.enabled}
                    onChange={(e) => setEditGame({ ...editGame, enabled: e.target.checked })}
                  />
                }
                label="Actif"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
