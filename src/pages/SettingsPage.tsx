import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Stack,
  Chip,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import { loadSettings, saveSettings, clearGame } from '../storage/localStorage';
import type { Settings } from '../types';

const e = React.createElement;

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
      setSaved(true);
    },
    []
  );

  const handleClearGame = useCallback(() => {
    clearGame();
    setCleared(true);
  }, []);

  return e(
    Container,
    { maxWidth: 'sm', sx: { py: 2, pb: 10 } },
    e(
      Typography,
      { variant: 'h5', color: 'primary.main', gutterBottom: true, textAlign: 'center' },
      'Paramètres'
    ),

    // Max rounds
    e(
      Card,
      { sx: { mb: 2 } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', gutterBottom: true }, 'Nombre de Manches'),
        e(
          Typography,
          { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } },
          'Par défaut, le jeu se joue en 10 manches. Vous pouvez ajuster ce nombre.'
        ),
        e(TextField, {
          type: 'number',
          label: 'Nombre de manches',
          value: settings.maxRounds,
          onChange: (ev: React.ChangeEvent<HTMLInputElement>) => {
            const val = parseInt(ev.target.value, 10);
            if (val >= 1 && val <= 20) {
              updateSetting('maxRounds', val);
            }
          },
          inputProps: { min: 1, max: 20 },
          size: 'small',
          fullWidth: true,
        })
      )
    ),

    // Loot settings
    e(
      Card,
      { sx: { mb: 2 } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', gutterBottom: true }, 'Cartes Butin (Loot)'),
        e(
          Typography,
          { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } },
          "Extension optionnelle. Quand activée, vous pouvez attribuer des points de butin à chaque joueur lors du décompte."
        ),
        e(
          FormControlLabel,
          {
            control: e(Switch, {
              checked: settings.lootEnabled,
              onChange: (_: unknown, checked: boolean) =>
                updateSetting('lootEnabled', checked),
              color: 'primary',
            }),
            label: 'Activer les cartes Butin',
          }
        ),
        settings.lootEnabled &&
          e(
            Box,
            { sx: { mt: 2 } },
            e(
              Typography,
              { variant: 'body2', sx: { mb: 1 } },
              'Valeurs autorisées :'
            ),
            e(
              Stack,
              { direction: 'row', spacing: 1, flexWrap: 'wrap' },
              ...settings.lootValues.map((val) =>
                e(Chip, {
                  key: val,
                  label: val > 0 ? `+${val}` : String(val),
                  color: val >= 0 ? 'success' : 'error',
                  variant: 'outlined',
                })
              )
            ),
            e(
              Typography,
              { variant: 'caption', color: 'text.secondary', sx: { mt: 1, display: 'block' } },
              'Valeurs par défaut : +20, +30, -10'
            )
          )
      )
    ),

    // Danger zone
    e(
      Card,
      { sx: { mb: 2, border: '1px solid', borderColor: 'error.main' } },
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', color: 'error.main', gutterBottom: true }, 'Zone de Danger'),
        e(
          Typography,
          { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } },
          'Supprimer la partie en cours. Cette action est irréversible.'
        ),
        e(
          Button,
          {
            variant: 'outlined',
            color: 'error',
            onClick: handleClearGame,
            fullWidth: true,
          },
          'Supprimer la Partie en Cours'
        )
      )
    ),

    // About
    e(
      Card,
      null,
      e(
        CardContent,
        null,
        e(Typography, { variant: 'h6', gutterBottom: true }, 'À Propos'),
        e(
          Typography,
          { variant: 'body2', color: 'text.secondary' },
          'Skull King Game Master v1.0.0'
        ),
        e(
          Typography,
          { variant: 'body2', color: 'text.secondary' },
          "Application de comptage de points pour le jeu de cartes Skull King. Fonctionne entièrement hors-ligne."
        )
      )
    ),

    // Snackbars
    e(
      Snackbar,
      {
        open: saved,
        autoHideDuration: 2000,
        onClose: () => setSaved(false),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
      e(Alert, { severity: 'success', onClose: () => setSaved(false) }, 'Paramètres sauvegardés !')
    ),
    e(
      Snackbar,
      {
        open: cleared,
        autoHideDuration: 2000,
        onClose: () => setCleared(false),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
      e(Alert, { severity: 'info', onClose: () => setCleared(false) }, 'Partie supprimée !')
    )
  );
}
