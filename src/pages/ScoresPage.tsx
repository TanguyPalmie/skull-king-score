import React from 'react';
import {
  Box,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { loadGame } from '../storage/localStorage';
import { calculateRoundScore } from '../engine/scoring';
import Scoreboard from '../components/Scoreboard';

const e = React.createElement;

function RoundAccordion({ round, getPlayerName }: {
  round: { roundNumber: number; playerData: any[]; completed: boolean };
  getPlayerName: (id: string) => string;
}) {
  return e(
    Accordion,
    { sx: { bgcolor: 'background.paper', mb: 1 } } as any,
    e(
      AccordionSummary,
      { expandIcon: e(ExpandMore, null) },
      e(Typography, { fontWeight: 600 }, `Manche ${round.roundNumber}`)
    ),
    e(
      AccordionDetails,
      null,
      e(
        TableContainer,
        null,
        e(
          Table,
          { size: 'small' },
          e(
            TableHead,
            null,
            e(
              TableRow,
              null,
              e(TableCell, { sx: { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }, 'Joueur'),
              e(TableCell, { align: 'center', sx: { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }, 'Ann.'),
              e(TableCell, { align: 'center', sx: { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }, 'Plis'),
              e(TableCell, { align: 'center', sx: { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }, 'Base'),
              e(TableCell, { align: 'center', sx: { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }, 'Bonus'),
              e(TableCell, { align: 'right', sx: { fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }, 'Total')
            )
          ),
          e(
            TableBody,
            null,
            ...round.playerData.map((pd: any) => {
              const score = calculateRoundScore(pd, round.roundNumber);
              return e(
                TableRow,
                { key: pd.playerId },
                e(TableCell, { sx: { fontSize: '0.8rem' } }, getPlayerName(pd.playerId)),
                e(TableCell, { align: 'center', sx: { fontSize: '0.8rem' } }, String(pd.bid)),
                e(TableCell, { align: 'center', sx: { fontSize: '0.8rem' } }, String(pd.tricks)),
                e(TableCell, { align: 'center', sx: { fontSize: '0.8rem' } }, String(score.baseScore)),
                e(
                  TableCell,
                  { align: 'center', sx: { fontSize: '0.8rem', color: 'warning.main' } },
                  score.bonusScore + score.lootScore > 0
                    ? `+${score.bonusScore + score.lootScore}`
                    : String(score.bonusScore + score.lootScore)
                ),
                e(
                  TableCell,
                  { align: 'right' },
                  e(Chip, {
                    label: String(score.totalRoundScore),
                    size: 'small',
                    color: score.totalRoundScore >= 0 ? 'success' : 'error',
                    sx: { fontWeight: 700, minWidth: 50, fontSize: '0.75rem' },
                  })
                )
              );
            })
          )
        )
      )
    )
  );
}

export default function ScoresPage() {
  const game = loadGame();

  if (!game || game.players.length === 0) {
    return e(
      Container,
      { maxWidth: 'sm', sx: { py: 4, textAlign: 'center' } },
      e(
        Typography,
        { variant: 'h5', color: 'primary.main', gutterBottom: true },
        'Scores'
      ),
      e(
        Typography,
        { color: 'text.secondary' },
        "Aucune partie en cours. Lancez une nouvelle partie depuis l'accueil !"
      )
    );
  }

  const completedRounds = game.rounds.filter((r) => r.completed);
  const getPlayerName = (id: string) =>
    game.players.find((p) => p.id === id)?.name ?? 'Inconnu';

  return e(
    Container,
    { maxWidth: 'sm', sx: { py: 2, pb: 10 } },
    e(
      Typography,
      { variant: 'h5', color: 'primary.main', gutterBottom: true, textAlign: 'center' },
      'Tableau des Scores'
    ),
    e(Scoreboard, { game }),
    completedRounds.length > 0 &&
      e(
        Box,
        { sx: { mt: 3 } },
        e(
          Typography,
          { variant: 'h6', color: 'primary.main', gutterBottom: true },
          'Détails par Manche'
        ),
        ...completedRounds.map((round) =>
          e(RoundAccordion, { key: round.roundNumber, round, getPlayerName })
        )
      )
  );
}
