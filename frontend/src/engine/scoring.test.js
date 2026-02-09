import { describe, it, expect } from 'vitest';
import { calculateRoundScore, calculateAllRoundScores, computeCumulativeScores, getRanking } from './scoring.js';

function makeData(overrides = {}) {
  return {
    playerId: 'p1',
    bid: 0,
    tricks: 0,
    piratesCaptured: 0,
    mermaidDefeatsSkullKing: false,
    davyJonesCreatures: 0,
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
  it('bid>0 not met (under) → -10×|diff|', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1 }), 4);
    expect(r.baseScore).toBe(-20);
  });
  it('bid>0 not met (over) → -10×|diff|', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 5 }), 4);
    expect(r.baseScore).toBe(-30);
  });

  // --- Bonuses only when bid is met ---
  it('pirates captured bonus when bid met → +30 each', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, piratesCaptured: 3 }), 1);
    expect(r.bonusScore).toBe(90);
    expect(r.totalRoundScore).toBe(130); // 40 + 90
  });
  it('mermaid defeats skull king when bid met → +50', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, mermaidDefeatsSkullKing: true }), 2);
    expect(r.bonusScore).toBe(50);
    expect(r.totalRoundScore).toBe(70); // 20 + 50
  });
  it('bonuses forfeited when bid is NOT met', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1, piratesCaptured: 2, mermaidDefeatsSkullKing: true }), 1);
    expect(r.baseScore).toBe(-20);
    expect(r.bonusScore).toBe(0);
    expect(r.totalRoundScore).toBe(-20);
  });
  it('bonuses forfeited when bid=0 missed', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 2, piratesCaptured: 1 }), 5);
    expect(r.baseScore).toBe(-50);
    expect(r.bonusScore).toBe(0);
    expect(r.totalRoundScore).toBe(-50);
  });
  it('loot points added when bid met', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: 50 }), 1);
    expect(r.totalRoundScore).toBe(70); // 20 + 50
  });
  it('loot negative points', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: -10 }), 1);
    expect(r.totalRoundScore).toBe(10); // 20 - 10
  });

  // --- Extension bonus cards (only when bid met) ---
  it('davy jones creatures → +30 each', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, davyJonesCreatures: 2 }), 1);
    expect(r.bonusScore).toBe(60);
    expect(r.totalRoundScore).toBe(80); // 20 + 60
  });
  it('all bonuses stack together when bid met', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 3, piratesCaptured: 1, mermaidDefeatsSkullKing: true,
      davyJonesCreatures: 1,
    }), 2);
    // base: 20×3=60, bonus: 30+50+30=110
    expect(r.baseScore).toBe(60);
    expect(r.bonusScore).toBe(110);
    expect(r.totalRoundScore).toBe(170);
  });
  it('all bonuses lost when bid missed despite having bonus cards', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 2, piratesCaptured: 1, mermaidDefeatsSkullKing: true,
      davyJonesCreatures: 1,
    }), 2);
    expect(r.baseScore).toBe(-10);
    expect(r.bonusScore).toBe(0);
    expect(r.totalRoundScore).toBe(-10);
  });
});

describe('calculateAllRoundScores', () => {
  it('calculates for multiple players', () => {
    const scores = calculateAllRoundScores([
      makeData({ playerId: 'p1', bid: 2, tricks: 2 }), // 20×2=40
      makeData({ playerId: 'p2', bid: 0, tricks: 0 }), // 10×3=30
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
