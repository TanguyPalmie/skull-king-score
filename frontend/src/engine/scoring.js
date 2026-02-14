/**
 * Calculate the score for a single player in a single round.
 *
 * Base scoring (official Skull King / Roi des Os rules):
 *   bid > 0 met  → +20×bid
 *   bid = 0 met  → +10×roundNumber
 *   bid > 0 miss → -10×|tricks-bid|
 *   bid = 0 miss → -10×roundNumber
 *
 * Bonus fields (only apply when bid is met, except Davy Jones):
 *   color14Captured          – 14 de couleur captures (+10 each)
 *   jollyRoger14Captured     – 14 Jolly Roger capture (+20)
 *   piratesCaptured          – pirates captures par SK (+30 each)
 *   mermaidDefeatsSkullKing  – sirene capture le Roi des Os (+50)
 *   secondCaptured           – SK/Sirene capture le Second (+30)
 *   butinAlliance            – alliances Butin reussies (+20 each)
 *   davyJonesLeviathans      – Casier de Davy Jones, leviathans detruits (+20 each, ALWAYS applies)
 *   sevenStarCount           – 7★ captures (-5 each, extension)
 *   eightStarCount           – 8★ captures (+5 each, extension)
 *   lootPoints               – free-form butin points
 */
export function calculateRoundScore(data, roundNumber) {
  const {
    bid, tricks,
    color14Captured = 0,
    jollyRoger14Captured = false,
    piratesCaptured = 0,
    mermaidDefeatsSkullKing = false,
    secondCaptured = false,
    butinAlliance = 0,
    davyJonesLeviathans = 0,
    sevenStarCount = 0,
    eightStarCount = 0,
    lootPoints = 0,
  } = data;

  const bidMet = tricks === bid;

  let baseScore;
  if (bidMet) {
    baseScore = bid > 0 ? 20 * bid : 10 * roundNumber;
  } else {
    baseScore = bid === 0 ? -10 * roundNumber : -10 * Math.abs(tricks - bid);
  }

  // Bonuses only count when bid is met (except Davy Jones)
  const bonusScore = bidMet
    ? color14Captured * 10 +
      (jollyRoger14Captured ? 20 : 0) +
      piratesCaptured * 30 +
      (mermaidDefeatsSkullKing ? 50 : 0) +
      (secondCaptured ? 30 : 0) +
      butinAlliance * 20 +
      davyJonesLeviathans * 20 +
      sevenStarCount * -5 +
      eightStarCount * 5
    : davyJonesLeviathans * 20;

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
