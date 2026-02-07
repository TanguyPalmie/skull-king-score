import { describe, it, expect } from 'vitest';
import { calculateRoundScore, calculateAllRoundScores, computeCumulativeScores, getRanking } from './scoring';
import type { RoundPlayerData } from '../types';

function makeData(overrides: Partial<RoundPlayerData> = {}): RoundPlayerData {
  return {
    playerId: 'p1',
    bid: 0,
    tricks: 0,
    piratesCaptured: 0,
    mermaidDefeatsSkullKing: false,
    whiteWhalePlayed: false,
    lootPoints: 0,
    ...overrides,
  };
}

describe('calculateRoundScore', () => {
  it('bid=0 met → +10×R', () => {
    const result = calculateRoundScore(makeData({ bid: 0, tricks: 0 }), 3);
    expect(result.baseScore).toBe(30); // 10 × 3
    expect(result.totalRoundScore).toBe(30);
  });

  it('bid=0 not met → -10×R', () => {
    const result = calculateRoundScore(makeData({ bid: 0, tricks: 2 }), 5);
    expect(result.baseScore).toBe(-50); // -10 × 5
    expect(result.totalRoundScore).toBe(-50);
  });

  it('bid>0 met → +20×bid', () => {
    const result = calculateRoundScore(makeData({ bid: 3, tricks: 3 }), 4);
    expect(result.baseScore).toBe(60); // 20 × 3
    expect(result.totalRoundScore).toBe(60);
  });

  it('bid>0 not met → -10×|tricks-bid|', () => {
    const result = calculateRoundScore(makeData({ bid: 3, tricks: 1 }), 4);
    expect(result.baseScore).toBe(-20); // -10 × |1-3| = -20
    expect(result.totalRoundScore).toBe(-20);
  });

  it('bid>0 not met (over) → -10×|tricks-bid|', () => {
    const result = calculateRoundScore(makeData({ bid: 2, tricks: 5 }), 4);
    expect(result.baseScore).toBe(-30); // -10 × |5-2| = -30
    expect(result.totalRoundScore).toBe(-30);
  });

  it('pirates captured bonus → +30 each', () => {
    const result = calculateRoundScore(
      makeData({ bid: 2, tricks: 2, piratesCaptured: 3 }),
      1
    );
    expect(result.baseScore).toBe(40);  // 20 × 2
    expect(result.bonusScore).toBe(90); // 30 × 3
    expect(result.totalRoundScore).toBe(130);
  });

  it('mermaid defeats skull king → +50', () => {
    const result = calculateRoundScore(
      makeData({ bid: 1, tricks: 1, mermaidDefeatsSkullKing: true }),
      2
    );
    expect(result.bonusScore).toBe(50);
    expect(result.totalRoundScore).toBe(70); // 20 + 50
  });

  it('bonuses apply even when bid is not met', () => {
    const result = calculateRoundScore(
      makeData({ bid: 3, tricks: 1, piratesCaptured: 2, mermaidDefeatsSkullKing: true }),
      1
    );
    expect(result.baseScore).toBe(-20);   // -10 × |1-3|
    expect(result.bonusScore).toBe(110);  // 30×2 + 50
    expect(result.totalRoundScore).toBe(90);
  });

  it('loot points added', () => {
    const result = calculateRoundScore(
      makeData({ bid: 1, tricks: 1, lootPoints: 50 }),
      1
    );
    expect(result.lootScore).toBe(50);
    expect(result.totalRoundScore).toBe(70); // 20 + 0 + 50
  });

  it('loot negative points', () => {
    const result = calculateRoundScore(
      makeData({ bid: 1, tricks: 1, lootPoints: -10 }),
      1
    );
    expect(result.lootScore).toBe(-10);
    expect(result.totalRoundScore).toBe(10); // 20 + 0 + (-10)
  });
});

describe('calculateAllRoundScores', () => {
  it('calculates for multiple players', () => {
    const data: RoundPlayerData[] = [
      makeData({ playerId: 'p1', bid: 2, tricks: 2 }),
      makeData({ playerId: 'p2', bid: 0, tricks: 0 }),
    ];
    const scores = calculateAllRoundScores(data, 3);
    expect(scores).toHaveLength(2);
    expect(scores[0].totalRoundScore).toBe(40); // 20×2
    expect(scores[1].totalRoundScore).toBe(30); // 10×3
  });
});

describe('computeCumulativeScores', () => {
  it('sums across rounds', () => {
    const rounds = [
      {
        roundNumber: 1,
        playerData: [
          makeData({ playerId: 'p1', bid: 1, tricks: 1 }),
          makeData({ playerId: 'p2', bid: 0, tricks: 0 }),
        ],
      },
      {
        roundNumber: 2,
        playerData: [
          makeData({ playerId: 'p1', bid: 0, tricks: 0 }),
          makeData({ playerId: 'p2', bid: 2, tricks: 2 }),
        ],
      },
    ];
    const totals = computeCumulativeScores(rounds);
    expect(totals.get('p1')).toBe(40);  // 20 + 20
    expect(totals.get('p2')).toBe(50);  // 10 + 40
  });
});

describe('getRanking', () => {
  it('ranks players by score descending', () => {
    const rounds = [
      {
        roundNumber: 1,
        playerData: [
          makeData({ playerId: 'p1', bid: 1, tricks: 1 }),  // 20
          makeData({ playerId: 'p2', bid: 3, tricks: 3 }),  // 60
          makeData({ playerId: 'p3', bid: 2, tricks: 2 }),  // 40
        ],
      },
    ];
    const ranking = getRanking(rounds);
    expect(ranking[0]).toMatchObject({ playerId: 'p2', totalScore: 60, rank: 1 });
    expect(ranking[1]).toMatchObject({ playerId: 'p3', totalScore: 40, rank: 2 });
    expect(ranking[2]).toMatchObject({ playerId: 'p1', totalScore: 20, rank: 3 });
  });

  it('ties get the same rank', () => {
    const rounds = [
      {
        roundNumber: 1,
        playerData: [
          makeData({ playerId: 'p1', bid: 2, tricks: 2 }),  // 40
          makeData({ playerId: 'p2', bid: 2, tricks: 2 }),  // 40
          makeData({ playerId: 'p3', bid: 1, tricks: 1 }),  // 20
        ],
      },
    ];
    const ranking = getRanking(rounds);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[1].rank).toBe(1);
    expect(ranking[2].rank).toBe(3);
  });
});
