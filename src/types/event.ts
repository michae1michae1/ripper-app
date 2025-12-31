export type EventType = 'draft' | 'sealed';

export type EventPhase = 
  | 'setup' 
  | 'drafting' 
  | 'deckbuilding' 
  | 'rounds' 
  | 'complete';

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G';

export interface Player {
  id: string;
  name: string;
  seatNumber: number;
  isHost: boolean;
  deckColors?: ManaColor[];
}

export interface DraftState {
  currentPack: 1 | 2 | 3;
  passDirection: 'left' | 'right';
  timerStartedAt: number | null;
  timerPausedAt: number | null;
  timerDuration: number; // seconds per pick
  isPaused: boolean;
}

export interface MatchResult {
  playerAWins: number;
  playerBWins: number;
  isDraw: boolean;
}

export interface Match {
  id: string;
  tableNumber: number;
  playerAId: string;
  playerBId: string | null; // null = bye
  result: MatchResult | null;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  isComplete: boolean;
  timerStartedAt: number | null;
  timerPausedAt: number | null;
  timerDuration: number; // 50 minutes default
  isPaused: boolean;
}

export interface PlayerStanding {
  playerId: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  opponentMatchWinPercentage: number;
  gameWinPercentage: number;
  opponentGameWinPercentage: number;
}

export interface EventSettings {
  roundTimerMinutes: number;
  draftPickSeconds: number;
  deckbuildingMinutes: number;
  totalRounds: number;
}

export interface EventSession {
  id: string;
  createdAt: number;
  updatedAt: number;
  type: EventType;
  name: string;
  players: Player[];
  currentPhase: EventPhase;
  currentRound: number;
  draftState: DraftState | null;
  deckbuildingState: {
    timerStartedAt: number | null;
    timerPausedAt: number | null;
    isPaused: boolean;
  } | null;
  rounds: Round[];
  settings: EventSettings;
}

export interface EventLog {
  timestamp: number;
  message: string;
  type: 'info' | 'action' | 'milestone';
}

