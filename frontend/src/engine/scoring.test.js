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
    goldBet: false,
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
  it('bid=0 not met → -10×R', () => {
    const r = calculateRoundScore(makeData({ bid: 0, tricks: 2 }), 5);
    expect(r.baseScore).toBe(-50);
  });
  it('bid>0 met → 20×bid + 10×tricks', () => {
    // bid=3, tricks=3: 20×3 + 10×3 = 90
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 3 }), 4);
    expect(r.baseScore).toBe(90);
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
    // base: 20×2 + 10×2 = 60, bonus: 90, total: 150
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, piratesCaptured: 3 }), 1);
    expect(r.bonusScore).toBe(90);
    expect(r.totalRoundScore).toBe(150);
  });
  it('mermaid defeats skull king → +50', () => {
    // base: 20×1 + 10×1 = 30, bonus: 50, total: 80
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, mermaidDefeatsSkullKing: true }), 2);
    expect(r.bonusScore).toBe(50);
    expect(r.totalRoundScore).toBe(80);
  });
  it('bonuses apply even when bid is not met', () => {
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 1, piratesCaptured: 2, mermaidDefeatsSkullKing: true }), 1);
    expect(r.baseScore).toBe(-20);
    expect(r.bonusScore).toBe(110);
    expect(r.totalRoundScore).toBe(90);
  });
  it('loot points added', () => {
    // base: 30, loot: 50, total: 80
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: 50 }), 1);
    expect(r.totalRoundScore).toBe(80);
  });
  it('loot negative points', () => {
    // base: 30, loot: -10, total: 20
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, lootPoints: -10 }), 1);
    expect(r.totalRoundScore).toBe(20);
  });

  // --- Extension bonus cards ---
  it('mermaids captured by SK → +20 each', () => {
    // base: 20×2+10×2=60, bonus: 40, total: 100
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, mermaidsCaptured: 2 }), 1);
    expect(r.bonusScore).toBe(40);
    expect(r.totalRoundScore).toBe(100);
  });
  it('raie manta → +20', () => {
    // base: 30, bonus: 20, total: 50
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, raieManta: true }), 1);
    expect(r.bonusScore).toBe(20);
    expect(r.totalRoundScore).toBe(50);
  });
  it('davy jones creatures → +30 each', () => {
    // base: 30, bonus: 60, total: 90
    const r = calculateRoundScore(makeData({ bid: 1, tricks: 1, davyJonesCreatures: 2 }), 1);
    expect(r.bonusScore).toBe(60);
    expect(r.totalRoundScore).toBe(90);
  });
  it('all bonuses stack together', () => {
    const r = calculateRoundScore(makeData({
      bid: 3, tricks: 3, piratesCaptured: 1, mermaidDefeatsSkullKing: true,
      mermaidsCaptured: 1, raieManta: true, davyJonesCreatures: 1,
    }), 2);
    // base: 20×3+10×3=90, bonus: 30+50+20+20+30=150
    expect(r.baseScore).toBe(90);
    expect(r.bonusScore).toBe(150);
    expect(r.totalRoundScore).toBe(240);
  });

  // --- Gold bet ---
  it('gold bet doubles base score when bid met (bid>0)', () => {
    // base: (20×3+10×3)×2 = 180
    const r = calculateRoundScore(makeData({ bid: 3, tricks: 3, goldBet: true }), 2);
    expect(r.baseScore).toBe(180);
    expect(r.totalRoundScore).toBe(180);
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
    // base: (20×2+10×2)×2 = 120, bonus: 30+50=80
    const r = calculateRoundScore(makeData({ bid: 2, tricks: 2, goldBet: true, piratesCaptured: 1, mermaidDefeatsSkullKing: true }), 1);
    expect(r.baseScore).toBe(120);
    expect(r.bonusScore).toBe(80);
    expect(r.totalRoundScore).toBe(200);
  });
});

describe('calculateAllRoundScores', () => {
  it('calculates for multiple players', () => {
    const scores = calculateAllRoundScores([
      makeData({ playerId: 'p1', bid: 2, tricks: 2 }), // 20×2+10×2=60
      makeData({ playerId: 'p2', bid: 0, tricks: 0 }), // 10×3=30
    ], 3);
    expect(scores[0].totalRoundScore).toBe(60);
    expect(scores[1].totalRoundScore).toBe(30);
  });
});

describe('computeCumulativeScores', () => {
  it('sums across rounds', () => {
    const totals = computeCumulativeScores([
      { roundNumber: 1, playerData: [makeData({ playerId: 'p1', bid: 1, tricks: 1 }), makeData({ playerId: 'p2', bid: 0, tricks: 0 })] },
      { roundNumber: 2, playerData: [makeData({ playerId: 'p1', bid: 0, tricks: 0 }), makeData({ playerId: 'p2', bid: 2, tricks: 2 })] },
    ]);
    // p1: R1=30 + R2=20 = 50, p2: R1=10 + R2=60 = 70
    expect(totals.get('p1')).toBe(50);
    expect(totals.get('p2')).toBe(70);
  });
});

describe('getRanking', () => {
  it('ranks players by score descending', () => {
    const ranking = getRanking([{
      roundNumber: 1,
      playerData: [
        makeData({ playerId: 'p1', bid: 1, tricks: 1 }), // 30
        makeData({ playerId: 'p2', bid: 3, tricks: 3 }), // 90
        makeData({ playerId: 'p3', bid: 2, tricks: 2 }), // 60
      ],
    }]);
    expect(ranking[0]).toMatchObject({ playerId: 'p2', totalScore: 90, rank: 1 });
    expect(ranking[1]).toMatchObject({ playerId: 'p3', totalScore: 60, rank: 2 });
    expect(ranking[2]).toMatchObject({ playerId: 'p1', totalScore: 30, rank: 3 });
  });
  it('ties get the same rank', () => {
    const ranking = getRanking([{
      roundNumber: 1,
      playerData: [
        makeData({ playerId: 'p1', bid: 2, tricks: 2 }), // 60
        makeData({ playerId: 'p2', bid: 2, tricks: 2 }), // 60
        makeData({ playerId: 'p3', bid: 1, tricks: 1 }), // 30
      ],
    }]);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[1].rank).toBe(1);
    expect(ranking[2].rank).toBe(3);
  });
});
