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

export type DraftLogType = 
  | 'draft_started'
  | 'pack_started' 
  | 'pack_completed' 
  | 'timer_paused' 
  | 'timer_resumed' 
  | 'timer_adjusted'
  | 'draft_completed';

export interface DraftLogEntry {
  id: string;
  timestamp: number;
  type: DraftLogType;
  message: string;
  data?: {
    pack?: number;
    duration?: number; // seconds for pack duration
    adjustment?: number; // seconds for timer adjustment
  };
}

export interface DraftState {
  currentPack: 1 | 2 | 3;
  passDirection: 'left' | 'right';
  timerStartedAt: number | null;
  timerPausedAt: number | null;
  timerDuration: number; // seconds per pick
  isPaused: boolean;
  isComplete: boolean; // true when draft is finished (all 3 packs done)
  packStartedAt: number | null; // timestamp when current pack started
  eventLog: DraftLogEntry[];
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
  eventCode: string;  // 4-char memorable code for easy sharing (e.g., "WXYZ")
  createdAt: number;
  updatedAt: number;
  type: EventType;
  name: string;
  setCode: string | null;  // MTG set code (e.g., "TLA", "DSK")
  setName: string | null;  // MTG set name (e.g., "Avatar: The Last Airbender")
  players: Player[];
  currentPhase: EventPhase;
  currentRound: number;
  draftState: DraftState | null;
  deckbuildingState: {
    timerStartedAt: number | null;
    timerPausedAt: number | null;
    timerDuration: number; // seconds
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

