import { useState, useCallback } from 'react';
import {
  Box, Typography, Container, Card, CardContent, Switch, FormControlLabel,
  TextField, Button, Stack, Chip, Snackbar, Alert,
} from '@mui/material';
import { loadSettingsLocal, saveSettingsLocal, clearGameLocal } from '../storage/localStorage.js';

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettingsLocal);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);

  const update = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettingsLocal(next);
      return next;
    });
    setSaved(true);
  }, []);

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h5" color="primary.main" gutterBottom textAlign="center">Paramètres</Typography>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" gutterBottom>Nombre de Manches</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Par défaut, le jeu se joue en 10 manches.
        </Typography>
        <TextField type="number" label="Nombre de manches" value={settings.maxRounds}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (v >= 1 && v <= 20) update('maxRounds', v); }}
          inputProps={{ min: 1, max: 20 }} size="small" fullWidth />
      </CardContent></Card>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" gutterBottom>Cartes Butin (Loot)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Extension optionnelle. Permet d'attribuer des points de butin à chaque joueur.
        </Typography>
        <FormControlLabel
          control={<Switch checked={settings.lootEnabled} onChange={(_, c) => update('lootEnabled', c)} color="primary" />}
          label="Activer les cartes Butin"
        />
        {settings.lootEnabled && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Valeurs autorisées :</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {settings.lootValues.map((val) => (
                <Chip key={val} label={val > 0 ? `+${val}` : String(val)} color={val >= 0 ? 'success' : 'error'} variant="outlined" />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent></Card>

      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'error.main' }}><CardContent>
        <Typography variant="h6" color="error.main" gutterBottom>Zone de Danger</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Supprimer la partie en cours. Action irréversible.
        </Typography>
        <Button variant="outlined" color="error" onClick={() => { clearGameLocal(); setCleared(true); }} fullWidth>
          Supprimer la Partie en Cours
        </Button>
      </CardContent></Card>

      <Card><CardContent>
        <Typography variant="h6" gutterBottom>À Propos</Typography>
        <Typography variant="body2" color="text.secondary">Skull King Game Master v1.0.0</Typography>
        <Typography variant="body2" color="text.secondary">Fonctionne entièrement hors-ligne.</Typography>
      </CardContent></Card>

      <Snackbar open={saved} autoHideDuration={2000} onClose={() => setSaved(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSaved(false)}>Paramètres sauvegardés !</Alert>
      </Snackbar>
      <Snackbar open={cleared} autoHideDuration={2000} onClose={() => setCleared(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" onClose={() => setCleared(false)}>Partie supprimée !</Alert>
      </Snackbar>
    </Container>
  );
}
