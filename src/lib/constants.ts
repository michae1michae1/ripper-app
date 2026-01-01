export const DEFAULT_SETTINGS = {
  roundTimerMinutes: 50,
  draftPickSeconds: 600, // 10 minutes per pack
  deckbuildingMinutes: 30,
  totalRounds: 3,
} as const;

export const SEALED_DECKBUILDING_MINUTES = 45;

export const MANA_COLORS = {
  W: { name: 'White', bg: 'bg-mana-white', text: 'text-slate-900', svg: 'https://svgs.scryfall.io/card-symbols/W.svg' },
  U: { name: 'Blue', bg: 'bg-mana-blue', text: 'text-white', svg: 'https://svgs.scryfall.io/card-symbols/U.svg' },
  B: { name: 'Black', bg: 'bg-mana-black', text: 'text-white', svg: 'https://svgs.scryfall.io/card-symbols/B.svg' },
  R: { name: 'Red', bg: 'bg-mana-red', text: 'text-white', svg: 'https://svgs.scryfall.io/card-symbols/R.svg' },
  G: { name: 'Green', bg: 'bg-mana-green', text: 'text-white', svg: 'https://svgs.scryfall.io/card-symbols/G.svg' },
} as const;

export const PACK_PASS_DIRECTION = {
  1: 'left',
  2: 'right',
  3: 'left',
} as const;

// Swiss pairing: 3 points for win, 1 for draw, 0 for loss
export const MATCH_POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
} as const;

export const MIN_PLAYERS = 2;
export const OPTIMAL_DRAFT_PLAYERS = 8;
export const MAX_PLAYERS = 16;

