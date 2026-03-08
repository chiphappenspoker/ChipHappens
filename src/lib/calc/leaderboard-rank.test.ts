import { describe, it, expect } from 'vitest';
import { formatLeaderboardRank } from './leaderboard-rank';

describe('formatLeaderboardRank', () => {
  it('returns A for rank 1', () => {
    expect(formatLeaderboardRank(1)).toBe('A');
  });
  it('returns K,Q,J for ranks 2,3,4', () => {
    expect(formatLeaderboardRank(2)).toBe('K');
    expect(formatLeaderboardRank(3)).toBe('Q');
    expect(formatLeaderboardRank(4)).toBe('J');
  });
  it('returns 10,9,8,7,6,5,4,3,2 for ranks 5-13', () => {
    expect(formatLeaderboardRank(5)).toBe('10');
    expect(formatLeaderboardRank(6)).toBe('9');
    expect(formatLeaderboardRank(7)).toBe('8');
    expect(formatLeaderboardRank(8)).toBe('7');
    expect(formatLeaderboardRank(9)).toBe('6');
    expect(formatLeaderboardRank(10)).toBe('5');
    expect(formatLeaderboardRank(11)).toBe('4');
    expect(formatLeaderboardRank(12)).toBe('3');
    expect(formatLeaderboardRank(13)).toBe('2');
  });
  it('returns numeric string for rank 14 and above', () => {
    expect(formatLeaderboardRank(14)).toBe('14');
    expect(formatLeaderboardRank(15)).toBe('15');
    expect(formatLeaderboardRank(99)).toBe('99');
  });
});
