import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import type { GameState } from '../types';
import { getRanking } from '../engine/scoring';

const e = React.createElement;

interface ScoreboardProps {
  game: GameState;
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Scoreboard({ game }: ScoreboardProps) {
  const completedRounds = game.rounds.filter((r) => r.completed);
  if (completedRounds.length === 0) {
    return e(
      Typography,
      { variant: 'body2', color: 'text.secondary', sx: { textAlign: 'center', py: 2 } },
      'Aucune manche terminée.'
    );
  }

  const ranking = getRanking(completedRounds);

  const getPlayer = (id: string) => game.players.find((p) => p.id === id);

  return e(
    Box,
    { sx: { mt: 2 } },
    e(
      Typography,
      { variant: 'h6', color: 'primary.main', gutterBottom: true, textAlign: 'center' },
      'Classement'
    ),
    e(
      TableContainer,
      { sx: { bgcolor: 'background.paper' } } as any,
      e(
        Table,
        { size: 'small' },
        e(
          TableHead,
          null,
          e(
            TableRow,
            null,
            e(TableCell, { sx: { color: 'primary.main', fontWeight: 700 } }, '#'),
            e(TableCell, { sx: { color: 'primary.main', fontWeight: 700 } }, 'Joueur'),
            e(
              TableCell,
              { align: 'right', sx: { color: 'primary.main', fontWeight: 700 } },
              'Score'
            )
          )
        ),
        e(
          TableBody,
          null,
          ...ranking.map((entry) => {
            const player = getPlayer(entry.playerId);
            const medal = RANK_MEDALS[entry.rank] || String(entry.rank);
            return e(
              TableRow,
              {
                key: entry.playerId,
                sx: entry.rank === 1 ? { bgcolor: 'rgba(212,175,55,0.1)' } : undefined,
              },
              e(
                TableCell,
                { sx: { fontSize: '1.1rem', width: 40 } },
                medal
              ),
              e(
                TableCell,
                null,
                e(
                  Box,
                  { sx: { display: 'flex', alignItems: 'center', gap: 1 } },
                  e(
                    Avatar,
                    {
                      src: player?.photo,
                      sx: { width: 28, height: 28, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: '0.8rem' },
                    },
                    player?.name?.[0]?.toUpperCase() ?? '?'
                  ),
                  e(Typography, { variant: 'body2' }, player?.name ?? 'Inconnu')
                )
              ),
              e(
                TableCell,
                { align: 'right' },
                e(
                  Chip,
                  {
                    label: String(entry.totalScore),
                    size: 'small',
                    color: entry.totalScore >= 0 ? 'success' : 'error',
                    sx: { fontWeight: 700, minWidth: 60 },
                  }
                )
              )
            );
          })
        )
      )
    )
  );
}
