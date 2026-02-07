import type { RoundPlayerData, RoundScore } from '../types';

/**
 * Calculate the score for a single player in a single round.
 *
 * Scoring rules:
 * - Bid met exactly:
 *   - bid > 0: +20 × bid
 *   - bid = 0: +10 × roundNumber
 * - Bid NOT met:
 *   - bid > 0: -10 × |tricks - bid|
 *   - bid = 0: -10 × roundNumber
 *
 * Bonuses (always applied):
 * - Skull King captures Pirates: +30 per pirate captured
 * - Mermaid defeats Skull King: +50
 *
 * Loot points are added as-is.
 */
export function calculateRoundScore(
  data: RoundPlayerData,
  roundNumber: number
): RoundScore {
  const { bid, tricks, piratesCaptured, mermaidDefeatsSkullKing, lootPoints } = data;

  let baseScore: number;

  if (tricks === bid) {
    // Bid met exactly
    baseScore = bid > 0 ? 20 * bid : 10 * roundNumber;
  } else {
    // Bid not met
    baseScore = bid > 0
      ? -10 * Math.abs(tricks - bid)
      : -10 * roundNumber;
  }

  const bonusScore =
    piratesCaptured * 30 +
    (mermaidDefeatsSkullKing ? 50 : 0);

  const lootScore = lootPoints;

  return {
    playerId: data.playerId,
    baseScore,
    bonusScore,
    lootScore,
    totalRoundScore: baseScore + bonusScore + lootScore,
  };
}

/**
 * Calculate scores for all players in a round.
 */
export function calculateAllRoundScores(
  roundData: RoundPlayerData[],
  roundNumber: number
): RoundScore[] {
  return roundData.map((d) => calculateRoundScore(d, roundNumber));
}

/**
 * Compute cumulative totals across multiple rounds.
 * Returns a map of playerId -> total score.
 */
export function computeCumulativeScores(
  allRounds: { roundNumber: number; playerData: RoundPlayerData[] }[]
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const round of allRounds) {
    const scores = calculateAllRoundScores(round.playerData, round.roundNumber);
    for (const s of scores) {
      totals.set(s.playerId, (totals.get(s.playerId) ?? 0) + s.totalRoundScore);
    }
  }

  return totals;
}

/**
 * Return players sorted by cumulative score descending.
 */
export function getRanking(
  allRounds: { roundNumber: number; playerData: RoundPlayerData[] }[]
): { playerId: string; totalScore: number; rank: number }[] {
  const totals = computeCumulativeScores(allRounds);
  const entries = Array.from(totals.entries())
    .map(([playerId, totalScore]) => ({ playerId, totalScore, rank: 0 }))
    .sort((a, b) => b.totalScore - a.totalScore);

  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].totalScore < entries[i - 1].totalScore) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }

  return entries;
}
