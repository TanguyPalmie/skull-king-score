import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loadGame } from '../storage/localStorage';

const e = React.createElement;

export default function HomePage() {
  const navigate = useNavigate();
  const savedGame = loadGame();
  const hasGame = savedGame && savedGame.phase !== 'finished';

  const handleNewGame = useCallback(() => {
    navigate('/game', { state: { newGame: true } });
  }, [navigate]);

  const handleResume = useCallback(() => {
    navigate('/game');
  }, [navigate]);

  return e(
    Container,
    { maxWidth: 'sm', sx: { py: 3, textAlign: 'center' } },
    e(
      Box,
      { sx: { mb: 4 } },
      e(
        Typography,
        {
          variant: 'h1',
          sx: {
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
            color: 'primary.main',
            mb: 1,
          },
        },
        '☠️ Skull King'
      ),
      e(
        Typography,
        {
          variant: 'h2',
          sx: {
            fontSize: { xs: '1.1rem', sm: '1.4rem' },
            color: 'text.secondary',
            mb: 3,
          },
        },
        'Game Master'
      ),
      e(
        Typography,
        { variant: 'body1', color: 'text.primary', sx: { mb: 4 } },
        'Compteur de points et assistant pour le jeu de cartes Skull King. Gérez vos parties, calculez les scores et consultez les règles !'
      )
    ),
    e(
      Stack,
      { spacing: 2, sx: { mb: 4 } },
      e(
        Button,
        {
          variant: 'contained',
          size: 'large',
          fullWidth: true,
          onClick: handleNewGame,
          sx: { py: 1.5, fontSize: '1.1rem' },
        },
        '🏴‍☠️ Nouvelle Partie'
      ),
      hasGame &&
        e(
          Button,
          {
            variant: 'outlined',
            size: 'large',
            fullWidth: true,
            onClick: handleResume,
            sx: {
              py: 1.5,
              fontSize: '1.1rem',
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          },
          '▶️ Reprendre la Partie'
        )
    ),
    e(
      Card,
      { sx: { textAlign: 'left' } },
      e(
        CardContent,
        null,
        e(
          Typography,
          { variant: 'h6', color: 'primary.main', gutterBottom: true },
          'Fonctionnalités'
        ),
        e(
          'ul',
          { style: { paddingLeft: 20, margin: 0 } },
          e('li', { style: { marginBottom: 4 } }, '2 à 12 joueurs'),
          e('li', { style: { marginBottom: 4 } }, 'Profils joueurs avec photo'),
          e('li', { style: { marginBottom: 4 } }, 'Calcul automatique des scores'),
          e('li', { style: { marginBottom: 4 } }, 'Bonus : Skull King, Sirènes, Pirates'),
          e('li', { style: { marginBottom: 4 } }, 'Cartes spéciales : Baleine Blanche, Butin'),
          e('li', { style: { marginBottom: 4 } }, 'Classement en temps réel'),
          e('li', { style: { marginBottom: 4 } }, 'Chatbot intégré pour les règles'),
          e('li', null, 'Sauvegarde locale automatique')
        )
      )
    )
  );
}
