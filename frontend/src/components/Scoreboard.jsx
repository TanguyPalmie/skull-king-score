import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip,
} from '@mui/material';
import { getRanking } from '../engine/scoring.js';

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Scoreboard({ game }) {
  const completedRounds = game.rounds.filter((r) => r.completed);
  if (completedRounds.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
        Aucune manche terminée.
      </Typography>
    );
  }

  const ranking = getRanking(completedRounds);
  const getPlayer = (id) => game.players.find((p) => p.id === id);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" color="primary.main" gutterBottom textAlign="center">
        Classement
      </Typography>
      <TableContainer sx={{ bgcolor: 'background.paper' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>Joueur</TableCell>
              <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 700 }}>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((entry) => {
              const player = getPlayer(entry.playerId);
              const medal = RANK_MEDALS[entry.rank] || String(entry.rank);
              return (
                <TableRow key={entry.playerId} sx={entry.rank === 1 ? { bgcolor: 'rgba(212,175,55,0.1)' } : undefined}>
                  <TableCell sx={{ fontSize: '1.1rem', width: 40 }}>{medal}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={player?.photo}
                        sx={{ width: 28, height: 28, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: '0.8rem' }}
                      >
                        {player?.name?.[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                      <Typography variant="body2">{player?.name ?? 'Inconnu'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={String(entry.totalScore)}
                      size="small"
                      color={entry.totalScore >= 0 ? 'success' : 'error'}
                      sx={{ fontWeight: 700, minWidth: 60 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
