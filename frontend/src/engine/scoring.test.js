import { describe, it, expect } from 'vitest';
import { calculateRoundScore, calculateAllRoundScores, computeCumulativeScores, getRanking } from './scoring.js';

function makeData(overrides = {}) {
  return {
    playerId: 'p1',
    bid: 0,
    tricks: 0,
    piratesCaptured: 0,
    mermaidDefeatsSkullKing: false,
    mermaidsCaptured: 0,
    raieManta: false,
    goldBet: false,
    lootPoints: 0,
    ...overrides,
  };
}

describe('calculateRoundScore', () => {
  it('bid=0 met → +10×R', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 0 }), 3);
    expect(r.baseScore).toBe(30);
    expect(r.totalRoundScore).toBe(30);
  });
  it('bid=0 not met → -10×R', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 2 }), 5);
    expect(r.baseScore).toBe(-50);
  });
  it('bid>0 met → +20×bid', () => {
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
  it('pirates captured bonus → +30 each', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, piratesCaptured: 3 }), 1);
    expect(r.bonusScore).toBe(90);
    expect(r.totalRoundScore).toBe(130);
  });
  it('mermaid defeats skull king → +50', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, mermaidDefeatsSkullKing: true }), 2);
    expect(r.bonusScore).toBe(50);
    expect(r.totalRoundScore).toBe(70);
  });
  it('bonuses apply even when bid is not met', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1, piratesCaptured: 2, mermaidDefeatsSkullKing: true }), 1);
    expect(r.baseScore).toBe(-20);
    expect(r.bonusScore).toBe(110);
    expect(r.totalRoundScore).toBe(90);
  });
  it('loot points added', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: 50 }), 1);
    expect(r.totalRoundScore).toBe(70);
  });
  it('loot negative points', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: -10 }), 1);
    expect(r.totalRoundScore).toBe(10);
  });

  // --- Extension bonus cards ---
  it('mermaids captured by SK → +20 each', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, mermaidsCaptured: 2 }), 1);
    expect(r.bonusScore).toBe(40);
    expect(r.totalRoundScore).toBe(80);
  });
  it('raie manta → +20', () => {
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, raieManta: true }), 1);
    expect(r.bonusScore).toBe(20);
    expect(r.totalRoundScore).toBe(40);
  });
  it('all bonuses stack together', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 3, piratesCaptured: 1, mermaidDefeatsSkullKing: true, mermaidsCaptured: 1, raieManta: true,
    }), 2);
    // base: 60, bonus: 30 + 50 + 20 + 20 = 120
    expect(r.baseScore).toBe(60);
    expect(r.bonusScore).toBe(120);
    expect(r.totalRoundScore).toBe(180);
  });

  // --- Gold bet ---
  it('gold bet doubles base score when bid met (bid>0)', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 3, goldBet: true }), 2);
    expect(r.baseScore).toBe(120); // 20×3 × 2
    expect(r.totalRoundScore).toBe(120);
  });
  it('gold bet doubles base score when bid=0 met', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 0, goldBet: true }), 4);
    expect(r.baseScore).toBe(80); // 10×4 × 2
    expect(r.totalRoundScore).toBe(80);
  });
  it('gold bet doubles penalty when bid missed', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1, goldBet: true }), 2);
    expect(r.baseScore).toBe(-40); // -10×2 × 2
    expect(r.totalRoundScore).toBe(-40);
  });
  it('gold bet does not affect bonuses', () => {
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, goldBet: true, piratesCaptured: 1, mermaidDefeatsSkullKing: true }), 1);
    expect(r.baseScore).toBe(80);  // 20×2 × 2
    expect(r.bonusScore).toBe(80); // 30 + 50 (not doubled)
    expect(r.totalRoundScore).toBe(160);
  });
});

describe('calculateAllRoundScores', () => {
  it('calculates for multiple players', () => {
    const scores = calculateAllRoundScores([
      makeData({ playerId: 'p1', bid: 2, tricks: 2 }),
      makeData({ playerId: 'p2', bid: 0, tricks: 0 }),
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
    expect(totals.get('p1')).toBe(40);
    expect(totals.get('p2')).toBe(50);
  });
});

describe('getRanking', () => {
  it('ranks players by score descending', () => {
    const ranking = getRanking([{
      roundNumber: 1,
      playerData: [
        makeData({ playerId: 'p1', bid: 1, tricks: 1 }),
        makeData({ playerId: 'p2', bid: 3, tricks: 3 }),
        makeData({ playerId: 'p3', bid: 2, tricks: 2 }),
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
        makeData({ playerId: 'p1', bid: 2, tricks: 2 }),
        makeData({ playerId: 'p2', bid: 2, tricks: 2 }),
        makeData({ playerId: 'p3', bid: 1, tricks: 1 }),
      ],
    }]);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[1].rank).toBe(1);
    expect(ranking[2].rank).toBe(3);
  });
});
