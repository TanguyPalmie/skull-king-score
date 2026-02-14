import { describe, it, expect } from 'vitest';
import { calculateRoundScore, calculateAllRoundScores, computeCumulativeScores, getRanking } from './scoring.js';

function makeData(overrides = {}) {
  return {
    playerId: 'p1',
    bid: 0,
    tricks: 0,
    color14Captured: 0,
    jollyRoger14Captured: false,
    piratesCaptured: 0,
    mermaidDefeatsSkullKing: false,
    secondCaptured: false,
    butinAlliance: 0,
    davyJonesLeviathans: 0,
    sevenStarCount: 0,
    eightStarCount: 0,
    lootPoints: 0,
    ...overrides,
  };
}

describe('calculateRoundScore', () => {
  // --- Base scoring ---
  it('bid=0 met → +10×R', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 0 }), 3);
    expect(r.baseScore).toBe(30);
    expect(r.totalRoundScore).toBe(30);
  });
  it('bid=0 not met → -10×R (regardless of tricks taken)', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 2 }), 5);
    expect(r.baseScore).toBe(-50);
  });
  it('bid=0 not met with 1 trick → -10×R', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 1 }), 9);
    expect(r.baseScore).toBe(-90);
  });
  it('bid>0 met → 20×bid', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 3 }), 4);
    expect(r.baseScore).toBe(60);
  });
  it('bid>0 not met (under) → -10', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1 }), 4);
    expect(r.baseScore).toBe(-10);
  });
  it('bid>0 not met (over) → -10', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 5 }), 4);
    expect(r.baseScore).toBe(-10);
  });
  it('bid>0 not met (off by 3) → still -10', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 0 }), 4);
    expect(r.baseScore).toBe(-10);
  });

  // --- Base bonuses (only when bid met) ---
  it('color 14 captured → +10 each', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, color14Captured: 3 }), 1);
    expect(r.bonusScore).toBe(30);
    expect(r.totalRoundScore).toBe(70); // 40 + 30
  });
  it('jolly roger 14 captured → +20', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, jollyRoger14Captured: true }), 1);
    expect(r.bonusScore).toBe(20);
    expect(r.totalRoundScore).toBe(40); // 20 + 20
  });
  it('pirates captured by SK → +30 each', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, piratesCaptured: 3 }), 1);
    expect(r.bonusScore).toBe(90);
    expect(r.totalRoundScore).toBe(130); // 40 + 90
  });
  it('mermaid defeats skull king → +50', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, mermaidDefeatsSkullKing: true }), 2);
    expect(r.bonusScore).toBe(50);
    expect(r.totalRoundScore).toBe(70); // 20 + 50
  });
  it('second captured by SK/mermaid → +30', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, secondCaptured: true }), 1);
    expect(r.bonusScore).toBe(30);
    expect(r.totalRoundScore).toBe(50); // 20 + 30
  });
  it('butin alliance → +20 each', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, butinAlliance: 2 }), 1);
    expect(r.bonusScore).toBe(40);
    expect(r.totalRoundScore).toBe(80); // 40 + 40
  });

  // --- Bonuses forfeited when bid missed ---
  it('bonuses forfeited when bid is NOT met', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 1, piratesCaptured: 2, mermaidDefeatsSkullKing: true,
      color14Captured: 1, secondCaptured: true,
    }), 1);
    expect(r.baseScore).toBe(-10);
    expect(r.bonusScore).toBe(0);
    expect(r.totalRoundScore).toBe(-10);
  });
  it('bonuses forfeited when bid=0 missed', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 2, piratesCaptured: 1 }), 5);
    expect(r.baseScore).toBe(-50);
    expect(r.bonusScore).toBe(0);
    expect(r.totalRoundScore).toBe(-50);
  });

  // --- Davy Jones: always applies even when bid missed ---
  it('davy jones leviathans → +20 each (bid met)', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, davyJonesLeviathans: 2 }), 1);
    expect(r.bonusScore).toBe(40);
    expect(r.totalRoundScore).toBe(60); // 20 + 40
  });
  it('davy jones leviathans count even when bid missed', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1, davyJonesLeviathans: 2 }), 1);
    expect(r.baseScore).toBe(-10);
    expect(r.bonusScore).toBe(40);
    expect(r.totalRoundScore).toBe(30); // -10 + 40
  });

  // --- Extension star cards ---
  it('7★ captured → -5 each (bid met)', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, sevenStarCount: 2 }), 1);
    expect(r.bonusScore).toBe(-10);
    expect(r.totalRoundScore).toBe(30); // 40 - 10
  });
  it('8★ captured → +5 each (bid met)', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, eightStarCount: 3 }), 1);
    expect(r.bonusScore).toBe(15);
    expect(r.totalRoundScore).toBe(55); // 40 + 15
  });
  it('7★ and 8★ forfeited when bid missed', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1, sevenStarCount: 1, eightStarCount: 2 }), 1);
    expect(r.bonusScore).toBe(0);
  });

  // --- Loot ---
  it('loot points added', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: 50 }), 1);
    expect(r.totalRoundScore).toBe(70); // 20 + 50
  });
  it('loot negative points', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: -10 }), 1);
    expect(r.totalRoundScore).toBe(10); // 20 - 10
  });

  // --- All bonuses stacking ---
  it('all bonuses stack together when bid met', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 3,
      color14Captured: 2, jollyRoger14Captured: true,
      piratesCaptured: 1, mermaidDefeatsSkullKing: true,
      secondCaptured: true, butinAlliance: 1,
      davyJonesLeviathans: 1, eightStarCount: 1,
    }), 2);
    // base: 20×3=60
    // bonus: 20+20+30+50+30+20+20+5 = 195
    expect(r.baseScore).toBe(60);
    expect(r.bonusScore).toBe(195);
    expect(r.totalRoundScore).toBe(255);
  });
  it('only davy jones counts when bid missed with all bonuses', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 2,
      color14Captured: 2, jollyRoger14Captured: true,
      piratesCaptured: 1, mermaidDefeatsSkullKing: true,
      secondCaptured: true, butinAlliance: 1,
      davyJonesLeviathans: 2, eightStarCount: 1,
    }), 2);
    expect(r.baseScore).toBe(-10); // flat -10
    expect(r.bonusScore).toBe(40); // only 2×20 davy jones
    expect(r.totalRoundScore).toBe(30);
  });
});

describe('calculateAllRoundScores', () => {
  it('calculates for multiple players', () => {
    const scores = calculateAllRoundScores([
      makeData({ playerId: 'p1', bid: 2, tricks: 2 }), // 40
      makeData({ playerId: 'p2', bid: 0, tricks: 0 }), // 30
    ], 3);
    expect(scores[0].totalRoundScore).toBe(40);
    expect(scores[1].totalRoundScore).toBe(30);
  });
});

describe('computeCumulativeScores', () => {
  it('sums across rounds', () => {
    const totals = computeCumulativeScores([
      { roundNumber: 1, playerData: [makeData({ playerId: 'p1', bid: 1, tricks: 1 }), makeData({ playerId: 'p2', bid: 0, tricks: 0 })] },
      { roundNumber: 2, playerData: [makeData({ playerId: 'p1', bid: 0, tricks: 0 }), makeData({ playerId: 'p2', bid: 2, tricks: 2 })] },
    ]);
    // p1: R1=20 + R2=20 = 40, p2: R1=10 + R2=40 = 50
    expect(totals.get('p1')).toBe(40);
    expect(totals.get('p2')).toBe(50);
  });
});

describe('getRanking', () => {
  it('ranks players by score descending', () => {
    const ranking = getRanking([{
      roundNumber: 1,
      playerData: [
        makeData({ playerId: 'p1', bid: 1, tricks: 1 }), // 20
        makeData({ playerId: 'p2', bid: 3, tricks: 3 }), // 60
        makeData({ playerId: 'p3', bid: 2, tricks: 2 }), // 40
      ],
    }]);
    expect(ranking[0]).toMatchObject({ playerId: 'p2', totalScore: 60, rank: 1 });
    expect(ranking[1]).toMatchObject({ playerId: 'p3', totalScore: 40, rank: 2 });
    expect(ranking[2]).toMatchObject({ playerId: 'p1', totalScore: 20, rank: 3 });
  });
  it('ties get the same rank', () => {
    const ranking = getRanking([{
      roundNumber: 1,
      playerData: [
        makeData({ playerId: 'p1', bid: 2, tricks: 2 }), // 40
        makeData({ playerId: 'p2', bid: 2, tricks: 2 }), // 40
        makeData({ playerId: 'p3', bid: 1, tricks: 1 }), // 20
      ],
    }]);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[1].rank).toBe(1);
    expect(ranking[2].rank).toBe(3);
  });
});
