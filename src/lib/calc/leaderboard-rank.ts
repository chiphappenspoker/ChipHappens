const PRE_FLOP_HAND_RANKINGS = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', '88', 'AKo', '77', 'AQs', 'AJs', 'ATs', 'AQo', '66',
  'A8s', 'KQs', 'KQo', 'A9s', 'ATo', 'KTs', 'AJo', 'A7s', 'QJs', 'QTs', 'KJs', 'A9o', 'KJo', 'A6s',
  'A5s', 'A4s', 'A8o', 'KTo', '55', 'K8s', 'A7o', 'K9s', 'K6s', 'A5o', 'K7s', 'A3s', 'QTo', 'QJo',
  'A6o', 'A4o', 'Q9s', 'J9s', 'JTo', 'JTs', 'K9o', '44', 'A2s', 'J8s', 'A3o', 'Q8s', '33', 'K7o',
  'Q9o', 'Q5s', 'Q7s', 'Q8o', 'A2o', 'K6o', 'K4s', 'K3o', 'K8o', 'T9s', 'Q7o', 'K5o', 'K5s', 'K2s',
  'Q6s', 'J9o', 'J7s', 'Q4s', 'Q6o', 'K3s', 'K4o', 'T9o', 'J6s', 'Q3s', 'J8o', 'T8s', 'T7s', 'Q2s',
  'Q5o', 'T7o', 'Q3o', 'J7o', 'Q4o', 'J3s', 'K2o', 'T5s', '22', 'T8o', '98s', '87s', 'J2s', 'J5s',
  '97s', 'J4s', 'T6s', '98o', 'Q2o', 'J6o', '96s', '76s', '86s', 'J4o', 'T6o', 'T4s', '97o', '96o',
  '95s', 'J5o', 'T3s', '93s', 'T2s', '94s', '75s', '85s', 'T4o', '87o', 'T5o', 'J2o', 'J3o', '84s',
  '86o', 'T3o', '65s', '85o', '64s', '95o', '53s', '92s', '76o', '74s', 'T2o', '94o', '82s', '54s',
  '84o', '73s', '93o', '83s', '63s', '74o', '52s', '65o', '75o', '43s', '83o', '64o', '62s', '92o',
  '53o', '72s', '54o', '42s', '82o', '73o', '63o', '32s', '52o', '43o', '72o', '42o', '62o', '32o',
] as const;

const RANK_NAME_MAP: Record<string, string> = {
  A: 'Ace',
  K: 'King',
  Q: 'Queen',
  J: 'Jack',
  T: '10',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
};

const SUIT_DEFS = [
  { suitSymbol: '♠' as const, suitName: 'Spades' as const, suitColor: 'black' as const },
  { suitSymbol: '♣' as const, suitName: 'Clubs' as const, suitColor: 'black' as const },
  { suitSymbol: '♥' as const, suitName: 'Hearts' as const, suitColor: 'red' as const },
  { suitSymbol: '♦' as const, suitName: 'Diamonds' as const, suitColor: 'red' as const },
];

export type LeaderboardPlayingCard = {
  shortRank: string;
  suitSymbol: (typeof SUIT_DEFS)[number]['suitSymbol'];
  suitName: (typeof SUIT_DEFS)[number]['suitName'];
  suitColor: (typeof SUIT_DEFS)[number]['suitColor'];
};

export type LeaderboardStartingHand = {
  handCode: string;
  cards: [LeaderboardPlayingCard, LeaderboardPlayingCard];
  fullName: string;
};

function suitednessPickIndex(handCode: string): number {
  let h = 0;
  for (let i = 0; i < handCode.length; i++) {
    h += handCode.charCodeAt(i) * (i + 1);
  }
  return h % 4;
}

export function getLeaderboardStartingHand(rank: number): LeaderboardStartingHand | null {
  const handCode = PRE_FLOP_HAND_RANKINGS[rank - 1];
  if (!handCode) return null;
  const firstRank = handCode[0];
  const secondRank = handCode[1];
  const modifier = handCode[2];
  const isPair = handCode.length === 2;
  const isSuited = modifier === 's';

  const r1 = firstRank === 'T' ? '10' : firstRank;
  const r2 = secondRank === 'T' ? '10' : secondRank;

  let cards: [LeaderboardPlayingCard, LeaderboardPlayingCard];
  if (isPair) {
    cards = [
      { shortRank: r1, ...SUIT_DEFS[0] },
      { shortRank: r2, ...SUIT_DEFS[2] },
    ];
  } else if (isSuited) {
    const s = SUIT_DEFS[suitednessPickIndex(handCode)];
    cards = [
      { shortRank: r1, ...s },
      { shortRank: r2, ...s },
    ];
  } else {
    cards = [
      { shortRank: r1, ...SUIT_DEFS[0] },
      { shortRank: r2, ...SUIT_DEFS[2] },
    ];
  }
  const firstName = RANK_NAME_MAP[firstRank];
  const secondName = RANK_NAME_MAP[secondRank];
  const shape = handCode.length === 2 ? 'pair' : isSuited ? 'suited' : 'offsuit';
  return {
    handCode,
    cards,
    fullName: handCode.length === 2
      ? `Pocket ${firstName}s`
      : `${firstName}-${secondName} ${shape}`,
  };
}

export function formatLeaderboardRank(rank: number): string {
  const hand = getLeaderboardStartingHand(rank);
  if (hand) return hand.handCode;
  return String(rank);
}
