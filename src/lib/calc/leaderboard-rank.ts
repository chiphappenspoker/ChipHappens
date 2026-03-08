const RANK_SYMBOLS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

export function formatLeaderboardRank(rank: number): string {
  if (rank >= 1 && rank <= 13) return RANK_SYMBOLS[rank - 1];
  return String(rank);
}
