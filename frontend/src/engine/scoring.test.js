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
  it('bid=0 not met → -10×|diff|', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 2 }), 5);
    expect(r.baseScore).toBe(-20);
  });
  it('bid>0 met → 20×bid', () => {
    // bid=3, tricks=3: 20×3 = 60
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

  // --- Standard bonuses ---
  it('pirates captured bonus → +30 each', () => {
    // base: 20×2=40, bonus: 90, total: 130
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, piratesCaptured: 3 }), 1);
    expect(r.bonusScore).toBe(90);
    expect(r.totalRoundScore).toBe(130);
  });
  it('mermaid defeats skull king → +50', () => {
    // base: 20×1=20, bonus: 50, total: 70
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
    // base: 20, loot: 50, total: 70
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: 50 }), 1);
    expect(r.totalRoundScore).toBe(70);
  });
  it('loot negative points', () => {
    // base: 20, loot: -10, total: 10
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: -10 }), 1);
    expect(r.totalRoundScore).toBe(10);
  });

  // --- Extension bonus cards ---
  it('mermaids captured by SK → +20 each', () => {
    // base: 20×2=40, bonus: 40, total: 80
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, mermaidsCaptured: 2 }), 1);
    expect(r.bonusScore).toBe(40);
    expect(r.totalRoundScore).toBe(80);
  });
  it('raie manta → +20', () => {
    // base: 20, bonus: 20, total: 40
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, raieManta: true }), 1);
    expect(r.bonusScore).toBe(20);
    expect(r.totalRoundScore).toBe(40);
  });
  it('davy jones creatures → +30 each', () => {
    // base: 20, bonus: 60, total: 80
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, davyJonesCreatures: 2 }), 1);
    expect(r.bonusScore).toBe(60);
    expect(r.totalRoundScore).toBe(80);
  });
  it('all bonuses stack together', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 3, piratesCaptured: 1, mermaidDefeatsSkullKing: true,
      mermaidsCaptured: 1, raieManta: true, davyJonesCreatures: 1,
    }), 2);
    // base: 20×3=60, bonus: 30+50+20+20+30=150
    expect(r.baseScore).toBe(60);
    expect(r.bonusScore).toBe(150);
    expect(r.totalRoundScore).toBe(210);
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
