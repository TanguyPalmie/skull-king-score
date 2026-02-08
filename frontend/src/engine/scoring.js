/**
 * Calculate the score for a single player in a single round.
 *
 * Bonus fields:
 *   piratesCaptured    – number of pirates captured by SK (+30 each)
 *   mermaidDefeatsSkullKing – mermaid beats SK (+50)
 *   mermaidsCaptured   – number of mermaids captured by SK (+20 each)
 *   raieManta          – captured the Manta Ray (+20)
 *   goldBet            – pari gold: doubles the base score (positive or negative)
 *   lootPoints         – free-form butin points
 */
export function calculateRoundScore(data, roundNumber) {
  const {
    bid, tricks,
    piratesCaptured = 0,
    mermaidDefeatsSkullKing = false,
    mermaidsCaptured = 0,
    raieManta = false,
    goldBet = false,
    lootPoints = 0,
  } = data;

  let baseScore;
  if (tricks === bid) {
    baseScore = bid > 0 ? 20 * bid : 10 * roundNumber;
  } else {
    baseScore = bid > 0 ? -10 * Math.abs(tricks - bid) : -10 * roundNumber;
  }

  // Gold bet doubles the base score (reward or penalty)
  if (goldBet) {
    baseScore *= 2;
  }

  const bonusScore =
    piratesCaptured * 30 +
    (mermaidDefeatsSkullKing ? 50 : 0) +
    mermaidsCaptured * 20 +
    (raieManta ? 20 : 0);

  const lootScore = lootPoints || 0;

  return {
    playerId: data.playerId,
    baseScore,
    bonusScore,
    lootScore,
    totalRoundScore: baseScore + bonusScore + lootScore,
  };
}

export function calculateAllRoundScores(roundData, roundNumber) {
  return roundData.map((d) => calculateRoundScore(d, roundNumber));
}

export function computeCumulativeScores(allRounds) {
  const totals = new Map();
  for (const round of allRounds) {
    const scores = calculateAllRoundScores(round.playerData, round.roundNumber);
    for (const s of scores) {
      totals.set(s.playerId, (totals.get(s.playerId) ?? 0) + s.totalRoundScore);
    }
  }
  return totals;
}

export function getRanking(allRounds) {
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
