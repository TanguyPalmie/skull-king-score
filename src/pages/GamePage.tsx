import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  TextField,
  IconButton,
  Avatar,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Add, Remove, Delete, PhotoCamera } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Player, GameState, RoundPlayerData, RoundData, GamePhase } from '../types';
import { saveGame, loadGame, clearGame, loadSettings, generateId } from '../storage/localStorage';
import { calculateRoundScore } from '../engine/scoring';
import Scoreboard from '../components/Scoreboard';

const e = React.createElement;

const PHASE_LABELS: Record<GamePhase, string> = {
  setup: 'Inscription',
  bidding: 'Annonces',
  playing: 'En jeu',
  scoring: 'Décompte',
  review: 'Résultats',
  finished: 'Terminé',
};

const STEPS = ['Inscription', 'Annonces', 'Plis & Bonus', 'Résultats'];

function phaseToStep(phase: GamePhase): number {
  switch (phase) {
    case 'setup': return 0;
    case 'bidding': return 1;
    case 'playing':
    case 'scoring': return 2;
    case 'review':
    case 'finished': return 3;
  }
}

function createEmptyGame(): GameState {
  return {
    id: generateId(),
    players: [],
    rounds: [],
    currentRound: 1,
    phase: 'setup',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createRoundData(players: Player[], roundNumber: number): RoundData {
  return {
    roundNumber,
    completed: false,
    playerData: players.map((p) => ({
      playerId: p.id,
      bid: 0,
      tricks: 0,
      piratesCaptured: 0,
      mermaidDefeatsSkullKing: false,
      whiteWhalePlayed: false,
      lootPoints: 0,
    })),
  };
}

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.state?.newGame === true;
  const settings = loadSettings();

  const [game, setGame] = useState<GameState>(() => {
    if (isNew) {
      clearGame();
      return createEmptyGame();
    }
    return loadGame() || createEmptyGame();
  });

  // Player setup state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Save on every change
  useEffect(() => {
    const updated = { ...game, updatedAt: new Date().toISOString() };
    saveGame(updated);
  }, [game]);

  // Clear location state after init
  useEffect(() => {
    if (isNew) {
      window.history.replaceState({}, '');
    }
  }, [isNew]);

  const updateGame = useCallback((patch: Partial<GameState>) => {
    setGame((prev) => ({ ...prev, ...patch }));
  }, []);

  const currentRound = game.rounds.find((r) => r.roundNumber === game.currentRound);

  const updatePlayerRoundData = useCallback(
    (playerId: string, patch: Partial<RoundPlayerData>) => {
      setGame((prev) => {
        const rounds = prev.rounds.map((r) => {
          if (r.roundNumber !== prev.currentRound) return r;
          return {
            ...r,
            playerData: r.playerData.map((pd) =>
              pd.playerId === playerId ? { ...pd, ...patch } : pd
            ),
          };
        });
        return { ...prev, rounds };
      });
    },
    []
  );

  const getPlayerName = useCallback(
    (id: string) => game.players.find((p) => p.id === id)?.name ?? id,
    [game.players]
  );

  // === SETUP ===
  const addPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name || game.players.length >= 12) return;
    const player: Player = { id: generateId(), name };
    updateGame({ players: [...game.players, player] });
    setNewPlayerName('');
  }, [newPlayerName, game.players, updateGame]);

  const removePlayer = useCallback(
    (id: string) => {
      updateGame({ players: game.players.filter((p) => p.id !== id) });
    },
    [game.players, updateGame]
  );

  const handlePhotoUpload = useCallback(
    (playerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const photo = reader.result as string;
        updateGame({
          players: game.players.map((p) =>
            p.id === playerId ? { ...p, photo } : p
          ),
        });
      };
      reader.readAsDataURL(file);
    },
    [game.players, updateGame]
  );

  const startGame = useCallback(() => {
    if (game.players.length < 2) return;
    const round = createRoundData(game.players, 1);
    updateGame({ phase: 'bidding', rounds: [round], currentRound: 1 });
  }, [game.players, updateGame]);

  // === BIDDING → SCORING ===
  const finishBidding = useCallback(() => {
    updateGame({ phase: 'scoring' });
  }, [updateGame]);

  // === SCORING → REVIEW ===
  const finishScoring = useCallback(() => {
    setGame((prev) => {
      const rounds = prev.rounds.map((r) => {
        if (r.roundNumber !== prev.currentRound) return r;
        return { ...r, completed: true };
      });
      return { ...prev, rounds, phase: 'review' };
    });
  }, []);

  // === NEXT ROUND or FINISH ===
  const nextRound = useCallback(() => {
    setGame((prev) => {
      const next = prev.currentRound + 1;
      if (next > settings.maxRounds) {
        return { ...prev, phase: 'finished' };
      }
      const round = createRoundData(prev.players, next);
      return {
        ...prev,
        rounds: [...prev.rounds, round],
        currentRound: next,
        phase: 'bidding',
      };
    });
  }, [settings.maxRounds]);

  const endGame = useCallback(() => {
    updateGame({ phase: 'finished' });
    setConfirmEnd(false);
  }, [updateGame]);

  const newGame = useCallback(() => {
    clearGame();
    setGame(createEmptyGame());
  }, []);

  // === RENDER ===
  const renderSetup = () =>
    e(
      Box,
      null,
      e(Typography, { variant: 'h5', gutterBottom: true, color: 'primary.main' }, 'Inscription des joueurs'),
      e(
        Typography,
        { variant: 'body2', sx: { mb: 2 }, color: 'text.secondary' },
        `${game.players.length}/12 joueurs (minimum 2)`
      ),
      e(
        Stack,
        { direction: 'row', spacing: 1, sx: { mb: 2 } },
        e(TextField, {
          label: 'Nom du joueur',
          value: newPlayerName,
          onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setNewPlayerName(ev.target.value),
          onKeyDown: (ev: React.KeyboardEvent) => {
            if (ev.key === 'Enter') addPlayer();
          },
          size: 'small',
          fullWidth: true,
        }),
        e(
          Button,
          {
            variant: 'contained',
            onClick: addPlayer,
            disabled: !newPlayerName.trim() || game.players.length >= 12,
          },
          'Ajouter'
        )
      ),
      e(
        Stack,
        { spacing: 1, sx: { mb: 3 } },
        ...game.players.map((player) =>
          e(
            Card,
            { key: player.id, sx: { p: 1 } },
            e(
              Stack,
              { direction: 'row', alignItems: 'center', spacing: 1.5, sx: { px: 1 } },
              e(
                Avatar,
                {
                  src: player.photo,
                  sx: { width: 40, height: 40, bgcolor: 'primary.main', color: 'primary.contrastText' },
                },
                player.name[0].toUpperCase()
              ),
              e(Typography, { sx: { flex: 1 } }, player.name),
              e(
                'label',
                { style: { display: 'inline-flex', cursor: 'pointer' } },
                e(
                  IconButton,
                  { size: 'small', color: 'primary' } as any,
                  e(PhotoCamera, { fontSize: 'small' })
                ),
                e('input', {
                  type: 'file',
                  accept: 'image/*',
                  capture: 'environment',
                  hidden: true,
                  onChange: (ev: React.ChangeEvent<HTMLInputElement>) =>
                    handlePhotoUpload(player.id, ev),
                })
              ),
              e(
                IconButton,
                { size: 'small', color: 'error', onClick: () => removePlayer(player.id) },
                e(Delete, { fontSize: 'small' })
              )
            )
          )
        )
      ),
      e(
        Button,
        {
          variant: 'contained',
          fullWidth: true,
          size: 'large',
          onClick: startGame,
          disabled: game.players.length < 2,
        },
        'Commencer la Partie'
      )
    );

  const renderBidding = () => {
    if (!currentRound) return null;
    return e(
      Box,
      null,
      e(
        Typography,
        { variant: 'h5', gutterBottom: true, color: 'primary.main' },
        `Manche ${game.currentRound} — Annonces`
      ),
      e(
        Typography,
        { variant: 'body2', sx: { mb: 2 }, color: 'text.secondary' },
        `Chaque joueur annonce combien de plis il pense gagner (0 à ${game.currentRound}).`
      ),
      e(
        Stack,
        { spacing: 2, sx: { mb: 3 } },
        ...currentRound.playerData.map((pd) =>
          e(
            Card,
            { key: pd.playerId, sx: { p: 2 } },
            e(
              Stack,
              { direction: 'row', alignItems: 'center', justifyContent: 'space-between' },
              e(Typography, { fontWeight: 600 }, getPlayerName(pd.playerId)),
              e(
                Stack,
                { direction: 'row', alignItems: 'center', spacing: 1 },
                e(
                  IconButton,
                  {
                    size: 'small',
                    color: 'primary',
                    onClick: () =>
                      updatePlayerRoundData(pd.playerId, {
                        bid: Math.max(0, pd.bid - 1),
                      }),
                    disabled: pd.bid <= 0,
                  },
                  e(Remove, null)
                ),
                e(
                  Chip,
                  {
                    label: String(pd.bid),
                    color: 'primary',
                    sx: { minWidth: 48, fontSize: '1.1rem', fontWeight: 700 },
                  }
                ),
                e(
                  IconButton,
                  {
                    size: 'small',
                    color: 'primary',
                    onClick: () =>
                      updatePlayerRoundData(pd.playerId, {
                        bid: Math.min(game.currentRound, pd.bid + 1),
                      }),
                    disabled: pd.bid >= game.currentRound,
                  },
                  e(Add, null)
                )
              )
            )
          )
        )
      ),
      e(
        Button,
        { variant: 'contained', fullWidth: true, size: 'large', onClick: finishBidding },
        'Valider les Annonces'
      )
    );
  };

  const renderScoring = () => {
    if (!currentRound) return null;
    return e(
      Box,
      null,
      e(
        Typography,
        { variant: 'h5', gutterBottom: true, color: 'primary.main' },
        `Manche ${game.currentRound} — Décompte`
      ),
      e(
        Stack,
        { spacing: 2, sx: { mb: 3 } },
        ...currentRound.playerData.map((pd) =>
          e(
            Card,
            { key: pd.playerId, sx: { p: 2 } },
            e(
              Typography,
              { fontWeight: 700, gutterBottom: true, color: 'primary.main' },
              `${getPlayerName(pd.playerId)} (annonce : ${pd.bid})`
            ),

            // Tricks
            e(
              Stack,
              { direction: 'row', alignItems: 'center', justifyContent: 'space-between', sx: { mb: 1.5 } },
              e(Typography, { variant: 'body2' }, 'Plis gagnés'),
              e(
                Stack,
                { direction: 'row', alignItems: 'center', spacing: 1 },
                e(
                  IconButton,
                  {
                    size: 'small',
                    onClick: () =>
                      updatePlayerRoundData(pd.playerId, {
                        tricks: Math.max(0, pd.tricks - 1),
                      }),
                    disabled: pd.tricks <= 0,
                  },
                  e(Remove, null)
                ),
                e(Chip, { label: String(pd.tricks), sx: { minWidth: 40 } }),
                e(
                  IconButton,
                  {
                    size: 'small',
                    onClick: () =>
                      updatePlayerRoundData(pd.playerId, {
                        tricks: pd.tricks + 1,
                      }),
                  },
                  e(Add, null)
                )
              )
            ),

            e(Divider, { sx: { my: 1 } }),

            // Pirates captured
            e(
              Stack,
              { direction: 'row', alignItems: 'center', justifyContent: 'space-between', sx: { mb: 1 } },
              e(Typography, { variant: 'body2' }, 'Pirates capturés par SK'),
              e(
                Stack,
                { direction: 'row', alignItems: 'center', spacing: 1 },
                e(
                  IconButton,
                  {
                    size: 'small',
                    onClick: () =>
                      updatePlayerRoundData(pd.playerId, {
                        piratesCaptured: Math.max(0, pd.piratesCaptured - 1),
                      }),
                    disabled: pd.piratesCaptured <= 0,
                  },
                  e(Remove, null)
                ),
                e(Chip, { label: String(pd.piratesCaptured), sx: { minWidth: 40 } }),
                e(
                  IconButton,
                  {
                    size: 'small',
                    onClick: () =>
                      updatePlayerRoundData(pd.playerId, {
                        piratesCaptured: pd.piratesCaptured + 1,
                      }),
                  },
                  e(Add, null)
                )
              )
            ),

            // Mermaid defeats SK
            e(
              FormControlLabel,
              {
                control: e(Switch, {
                  checked: pd.mermaidDefeatsSkullKing,
                  onChange: (_: unknown, checked: boolean) =>
                    updatePlayerRoundData(pd.playerId, {
                      mermaidDefeatsSkullKing: checked,
                    }),
                  color: 'primary',
                }),
                label: 'Sirène bat le Skull King (+50)',
                sx: { mb: 0.5 },
              }
            ),

            // White Whale
            e(
              FormControlLabel,
              {
                control: e(Switch, {
                  checked: pd.whiteWhalePlayed,
                  onChange: (_: unknown, checked: boolean) =>
                    updatePlayerRoundData(pd.playerId, {
                      whiteWhalePlayed: checked,
                    }),
                  color: 'warning',
                }),
                label: 'Baleine Blanche jouée',
              }
            ),

            // Loot
            settings.lootEnabled &&
              e(
                Box,
                { sx: { mt: 1.5 } },
                e(Typography, { variant: 'body2', sx: { mb: 1 } }, 'Points de Butin'),
                e(
                  Stack,
                  { direction: 'row', spacing: 0.5, flexWrap: 'wrap' },
                  ...settings.lootValues.map((val) =>
                    e(
                      Button,
                      {
                        key: val,
                        size: 'small',
                        variant: 'outlined',
                        onClick: () =>
                          updatePlayerRoundData(pd.playerId, {
                            lootPoints: pd.lootPoints + val,
                          }),
                        sx: { minWidth: 60 },
                      },
                      val > 0 ? `+${val}` : String(val)
                    )
                  ),
                  e(
                    Button,
                    {
                      size: 'small',
                      variant: 'text',
                      color: 'error',
                      onClick: () =>
                        updatePlayerRoundData(pd.playerId, { lootPoints: 0 }),
                    },
                    'Reset'
                  )
                ),
                pd.lootPoints !== 0 &&
                  e(
                    Typography,
                    {
                      variant: 'body2',
                      sx: { mt: 0.5, color: pd.lootPoints > 0 ? 'success.main' : 'error.main' },
                    },
                    `Butin : ${pd.lootPoints > 0 ? '+' : ''}${pd.lootPoints}`
                  )
              )
          )
        )
      ),
      e(
        Button,
        { variant: 'contained', fullWidth: true, size: 'large', onClick: finishScoring },
        'Calculer les Scores'
      )
    );
  };

  const renderReview = () => {
    if (!currentRound) return null;
    return e(
      Box,
      null,
      e(
        Typography,
        { variant: 'h5', gutterBottom: true, color: 'primary.main' },
        `Manche ${game.currentRound} — Résultats`
      ),
      e(
        Stack,
        { spacing: 1.5, sx: { mb: 3 } },
        ...currentRound.playerData.map((pd) => {
          const score = calculateRoundScore(pd, game.currentRound);
          return e(
            Card,
            { key: pd.playerId, sx: { p: 2 } },
            e(
              Stack,
              { direction: 'row', justifyContent: 'space-between', alignItems: 'center' },
              e(
                Box,
                null,
                e(Typography, { fontWeight: 700 }, getPlayerName(pd.playerId)),
                e(
                  Typography,
                  { variant: 'body2', color: 'text.secondary' },
                  `Annonce : ${pd.bid} | Plis : ${pd.tricks}`
                )
              ),
              e(
                Box,
                { sx: { textAlign: 'right' } },
                e(
                  Typography,
                  {
                    variant: 'h6',
                    color: score.totalRoundScore >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 700,
                  },
                  `${score.totalRoundScore >= 0 ? '+' : ''}${score.totalRoundScore}`
                ),
                score.bonusScore > 0 &&
                  e(
                    Typography,
                    { variant: 'caption', color: 'warning.main' },
                    `Bonus : +${score.bonusScore}`
                  ),
                score.lootScore !== 0 &&
                  e(
                    Typography,
                    { variant: 'caption', color: 'text.secondary' },
                    `Butin : ${score.lootScore > 0 ? '+' : ''}${score.lootScore}`
                  )
              )
            )
          );
        })
      ),

      // Scoreboard
      e(Scoreboard, { game }),

      e(
        Stack,
        { direction: 'row', spacing: 2, sx: { mt: 3 } },
        e(
          Button,
          {
            variant: 'outlined',
            color: 'error',
            onClick: () => setConfirmEnd(true),
            sx: { flex: 1 },
          },
          'Terminer'
        ),
        e(
          Button,
          {
            variant: 'contained',
            onClick: nextRound,
            sx: { flex: 2 },
          },
          game.currentRound >= settings.maxRounds
            ? 'Voir le Classement Final'
            : `Manche ${game.currentRound + 1} →`
        )
      ),

      // Confirm end dialog
      e(
        Dialog,
        { open: confirmEnd, onClose: () => setConfirmEnd(false) },
        e(DialogTitle, null, 'Terminer la partie ?'),
        e(
          DialogContent,
          null,
          e(
            Typography,
            null,
            'Voulez-vous vraiment terminer la partie en cours ? Le classement final sera affiché.'
          )
        ),
        e(
          DialogActions,
          null,
          e(Button, { onClick: () => setConfirmEnd(false) }, 'Annuler'),
          e(Button, { onClick: endGame, color: 'error', variant: 'contained' }, 'Terminer')
        )
      )
    );
  };

  const renderFinished = () =>
    e(
      Box,
      null,
      e(
        Typography,
        { variant: 'h4', gutterBottom: true, color: 'primary.main', textAlign: 'center' },
        '🏆 Partie Terminée !'
      ),
      e(Scoreboard, { game }),
      e(
        Stack,
        { spacing: 2, sx: { mt: 3 } },
        e(
          Button,
          { variant: 'contained', fullWidth: true, size: 'large', onClick: newGame },
          '🏴‍☠️ Nouvelle Partie'
        ),
        e(
          Button,
          {
            variant: 'outlined',
            fullWidth: true,
            onClick: () => navigate('/scores'),
          },
          'Voir les Détails'
        )
      )
    );

  const renderPhase = () => {
    switch (game.phase) {
      case 'setup':
        return renderSetup();
      case 'bidding':
        return renderBidding();
      case 'playing':
      case 'scoring':
        return renderScoring();
      case 'review':
        return renderReview();
      case 'finished':
        return renderFinished();
    }
  };

  return e(
    Container,
    { maxWidth: 'sm', sx: { py: 2, pb: 10 } },
    game.phase !== 'setup' &&
      game.phase !== 'finished' &&
      e(
        Box,
        { sx: { mb: 2 } },
        e(
          Stepper,
          {
            activeStep: phaseToStep(game.phase),
            alternativeLabel: true,
            sx: {
              '& .MuiStepLabel-label': { fontSize: '0.7rem', color: 'text.secondary' },
              '& .MuiStepLabel-label.Mui-active': { color: 'primary.main' },
              '& .MuiStepLabel-label.Mui-completed': { color: 'success.main' },
            },
          },
          ...STEPS.map((label) =>
            e(Step, { key: label }, e(StepLabel, null, label))
          )
        )
      ),
    game.phase !== 'setup' &&
      game.phase !== 'finished' &&
      e(
        Alert,
        {
          severity: 'info',
          sx: { mb: 2, bgcolor: 'rgba(212,175,55,0.1)', color: 'text.primary' },
        },
        `Manche ${game.currentRound}/${settings.maxRounds} — ${PHASE_LABELS[game.phase]}`
      ),
    renderPhase()
  );
}
