import {
  Box,
  Typography,
  Container,
  Card,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ExpandMore, EmojiEvents } from '@mui/icons-material';
import { computePlayerRoundScore, storageKey } from './GenericGame.jsx';

function loadGameLocal(slug) {
  const raw = localStorage.getItem(storageKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const STEPPER_LABELS = {
  round: 'Manche',
  manche: 'Manche',
  phase: 'Phase',
  tour: 'Tour',
  niveau: 'Niveau',
  partie: 'Partie',
  age: 'Âge',
  main: 'Main',
};

export default function GenericScores({ gameConfig }) {
  const slug = gameConfig?.slug || 'unknown';
  const scoringType = gameConfig?.scoring_type || 'simple';
  const stepLabel = STEPPER_LABELS[gameConfig?.stepper_type] || 'Manche';
  const game = loadGameLocal(slug);

  if (!game || game.players.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="primary.main" gutterBottom>
          {gameConfig?.icon} Scores — {gameConfig?.name}
        </Typography>
        <Typography color="text.secondary">Aucune partie enregistrée.</Typography>
      </Container>
    );
  }

  const completedRounds = game.rounds.filter((r) => r.completed);
  const getPlayerName = (id) => game.players.find((p) => p.id === id)?.name ?? 'Inconnu';

  // Cumul
  const totals = {};
  game.players.forEach((p) => (totals[p.id] = 0));
  for (const round of completedRounds) {
    for (const pd of round.playerData) {
      totals[pd.playerId] = (totals[pd.playerId] || 0) + computePlayerRoundScore(pd, round.roundNumber, scoringType);
    }
  }
  const ranking = Object.entries(totals)
    .map(([id, score]) => ({ playerId: id, totalScore: score }))
    .sort((a, b) => b.totalScore - a.totalScore);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h5" color="primary.main" gutterBottom textAlign="center">
        {gameConfig?.icon} Tableau des Scores
      </Typography>

      {/* Classement */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <EmojiEvents color="primary" />
          <Typography variant="h6" color="primary.main">
            Classement
          </Typography>
        </Stack>
        <Stack spacing={0.5}>
          {ranking.map((entry, idx) => (
            <Stack
              key={entry.playerId}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 1, borderRadius: 1, bgcolor: idx === 0 ? 'rgba(169,151,134,0.08)' : 'transparent' }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ width: 28, textAlign: 'center', fontWeight: 700 }}>
                  {idx < 3 ? medals[idx] : `${idx + 1}.`}
                </Typography>
                <Typography fontWeight={idx === 0 ? 700 : 500}>{getPlayerName(entry.playerId)}</Typography>
              </Stack>
              <Chip
                label={String(entry.totalScore)}
                size="small"
                color={entry.totalScore >= 0 ? 'primary' : 'error'}
                sx={{ fontWeight: 700, minWidth: 56 }}
              />
            </Stack>
          ))}
        </Stack>
      </Card>

      {/* Detail par manche */}
      {completedRounds.length > 0 && (
        <Box>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Détails par {stepLabel}
          </Typography>
          {completedRounds.map((round) => (
            <Accordion key={round.roundNumber} sx={{ bgcolor: 'background.paper', mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={600}>{stepLabel} {round.roundNumber}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Joueur</TableCell>
                        {scoringType === 'bid_tricks' && (
                          <>
                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              Ann.
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              Plis
                            </TableCell>
                          </>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          Score
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {round.playerData.map((pd) => {
                        const s = computePlayerRoundScore(pd, round.roundNumber, scoringType);
                        return (
                          <TableRow key={pd.playerId}>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{getPlayerName(pd.playerId)}</TableCell>
                            {scoringType === 'bid_tricks' && (
                              <>
                                <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                                  {pd.bid}
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                                  {pd.tricks}
                                </TableCell>
                              </>
                            )}
                            <TableCell align="right">
                              <Chip
                                label={String(s)}
                                size="small"
                                color={s >= 0 ? 'success' : 'error'}
                                sx={{ fontWeight: 700, minWidth: 50, fontSize: '0.75rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Container>
  );
}
