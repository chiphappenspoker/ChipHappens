import { describe, it, expect } from 'vitest';
import { formatLeaderboardRank, getLeaderboardStartingHand } from './leaderboard-rank';

describe('formatLeaderboardRank', () => {
  it('returns AA for rank 1', () => {
    expect(formatLeaderboardRank(1)).toBe('AA');
  });
  it('returns ranked preflop hand codes', () => {
    expect(formatLeaderboardRank(4)).toBe('JJ');
    expect(formatLeaderboardRank(7)).toBe('AKs');
    expect(formatLeaderboardRank(169)).toBe('32o');
  });
  it('returns numeric string for rank 170 and above', () => {
    expect(formatLeaderboardRank(170)).toBe('170');
    expect(formatLeaderboardRank(199)).toBe('199');
  });

  it('returns two-card metadata for ranked hands', () => {
    expect(getLeaderboardStartingHand(1)).toEqual({
      handCode: 'AA',
      cards: [
        { shortRank: 'A', suitSymbol: '♠', suitName: 'Spades', suitColor: 'black' },
        { shortRank: 'A', suitSymbol: '♥', suitName: 'Hearts', suitColor: 'red' },
      ],
      fullName: 'Pocket Aces',
    });
    const aks = getLeaderboardStartingHand(7);
    expect(aks?.handCode).toBe('AKs');
    expect(aks?.cards[0].suitSymbol).toBe(aks?.cards[1].suitSymbol);
    expect(aks?.cards[0].suitColor).toBe(aks?.cards[1].suitColor);
    expect(aks?.cards[0].suitSymbol).toBe('♠');
    expect(aks?.cards[0].suitColor).toBe('black');
    expect(getLeaderboardStartingHand(9)?.handCode).toBe('AKo');
    expect(getLeaderboardStartingHand(9)?.cards[0].suitSymbol).toBe('♠');
    expect(getLeaderboardStartingHand(9)?.cards[1].suitSymbol).toBe('♥');
    expect(getLeaderboardStartingHand(9)?.cards[0].suitColor).toBe('black');
    expect(getLeaderboardStartingHand(9)?.cards[1].suitColor).toBe('red');
  });

  it('returns null hand metadata after rank 169', () => {
    expect(getLeaderboardStartingHand(170)).toBeNull();
  });
});
