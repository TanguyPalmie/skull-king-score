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
import { calculateRoundScore } from './scoring.js';
import Scoreboard from './Scoreboard.jsx';

const STORAGE_KEY = 'gamemaster-skull-king-game';

function loadGameLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function RoundAccordion({ round, getPlayerName }) {
  return (
    <Accordion sx={{ bgcolor: 'background.paper', mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography fontWeight={600}>Manche {round.roundNumber}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Joueur</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  Ann.
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  Plis
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  Base
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  Bonus
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {round.playerData.map((pd) => {
                const score = calculateRoundScore(pd, round.roundNumber);
                return (
                  <TableRow key={pd.playerId}>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{getPlayerName(pd.playerId)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                      {pd.bid}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                      {pd.tricks}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                      {score.baseScore}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: 'warning.main' }}>
                      {score.bonusScore + score.bonusMalusScore > 0
                        ? `+${score.bonusScore + score.bonusMalusScore}`
                        : score.bonusScore + score.bonusMalusScore}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={String(score.totalRoundScore)}
                        size="small"
                        color={score.totalRoundScore >= 0 ? 'success' : 'error'}
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
  );
}

export default function SkullKingScores() {
  const game = loadGameLocal();

  if (!game || game.players.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="primary.main" gutterBottom>
          Scores Skull King
        </Typography>
        <Typography color="text.secondary">Aucune partie en cours. Lancez une nouvelle partie !</Typography>
      </Container>
    );
  }

  const completedRounds = game.rounds.filter((r) => r.completed);
  const getPlayerName = (id) => game.players.find((p) => p.id === id)?.name ?? 'Inconnu';

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h5" color="primary.main" gutterBottom textAlign="center">
        Tableau des Scores
      </Typography>
      <Scoreboard game={game} />
      {completedRounds.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Details par Manche
          </Typography>
          {completedRounds.map((round) => (
            <RoundAccordion key={round.roundNumber} round={round} getPlayerName={getPlayerName} />
          ))}
        </Box>
      )}
    </Container>
  );
}
