import { create } from 'zustand';
import type { 
  EventSession, 
  EventType, 
  Player, 
  EventPhase,
  DraftState,
  Round,
  MatchResult,
  ManaColor 
} from '@/types/event';
import { createEventId, createEventCode, createPlayerId, createMatchId } from './generateId';
import { DEFAULT_SETTINGS, SEALED_DECKBUILDING_MINUTES, PACK_PASS_DIRECTION } from './constants';

interface EventStore {
  event: EventSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Event lifecycle
  createEvent: (type: EventType, hostName: string) => EventSession;
  loadEvent: (event: EventSession) => void;
  clearEvent: () => void;
  resetEvent: () => void;
  updateEventCode: (newCode: string) => void;
  
  // Player management
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerName: (playerId: string, name: string) => void;
  randomizeSeating: () => void;
  setPlayerDeckColors: (playerId: string, colors: ManaColor[]) => void;
  
  // Phase transitions
  startEvent: () => void;
  advanceToPhase: (phase: EventPhase) => void;
  
  // Draft controls
  nextPack: () => void;
  setCurrentPack: (pack: 1 | 2 | 3) => void;
  markDraftComplete: () => void;
  
  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  adjustTimer: (seconds: number) => void;
  resetTimer: () => void;
  
  // Round management
  generatePairings: (roundNumber: number) => void;
  updateMatchResult: (matchId: string, result: MatchResult) => void;
  finalizeRound: () => void;
  
  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function createInitialDraftState(): DraftState {
  return {
    currentPack: 1,
    passDirection: 'left',
    timerStartedAt: null,
    timerPausedAt: null,
    timerDuration: DEFAULT_SETTINGS.draftPickSeconds,
    isPaused: true,
    isComplete: false,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useEventStore = create<EventStore>((set, get) => ({
  event: null,
  isLoading: false,
  error: null,

  createEvent: (type, hostName) => {
    const event: EventSession = {
      id: createEventId(),
      eventCode: createEventCode(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type,
      name: type === 'draft' ? 'Booster Draft' : 'Sealed Deck',
      players: [{
        id: createPlayerId(),
        name: hostName,
        seatNumber: 1,
        isHost: true,
      }],
      currentPhase: 'setup',
      currentRound: 0,
      draftState: type === 'draft' ? createInitialDraftState() : null,
      deckbuildingState: null,
      rounds: [],
      settings: {
        ...DEFAULT_SETTINGS,
        deckbuildingMinutes: type === 'sealed' 
          ? SEALED_DECKBUILDING_MINUTES 
          : DEFAULT_SETTINGS.deckbuildingMinutes,
      },
    };
    
    set({ event, error: null });
    return event;
  },

  loadEvent: (event) => {
    set({ event, isLoading: false, error: null });
  },

  clearEvent: () => {
    set({ event: null, error: null });
  },

  resetEvent: () => {
    const { event } = get();
    if (!event) return;
    
    // Keep the same ID and players, but reset all progress
    const resetEvent: EventSession = {
      ...event,
      currentPhase: 'setup',
      currentRound: 0,
      draftState: event.type === 'draft' ? createInitialDraftState() : null,
      deckbuildingState: null,
      rounds: [],
      // Reset player match history but keep names and seat numbers
      players: event.players.map(p => ({
        ...p,
        deckColors: undefined,
      })),
      updatedAt: Date.now(),
    };
    
    set({ event: resetEvent, error: null });
  },

  updateEventCode: (newCode) => {
    const { event } = get();
    if (!event) return;
    
    set({
      event: {
        ...event,
        eventCode: newCode.toUpperCase(),
        updatedAt: Date.now(),
      },
    });
  },

  addPlayer: (name) => {
    const { event } = get();
    if (!event) return;
    
    const newPlayer: Player = {
      id: createPlayerId(),
      name,
      seatNumber: event.players.length + 1,
      isHost: false,
    };
    
    set({
      event: {
        ...event,
        players: [...event.players, newPlayer],
        updatedAt: Date.now(),
      },
    });
  },

  removePlayer: (playerId) => {
    const { event } = get();
    if (!event) return;
    
    const filteredPlayers = event.players.filter(p => p.id !== playerId);
    // Reindex seat numbers
    const reindexedPlayers = filteredPlayers.map((p, i) => ({
      ...p,
      seatNumber: i + 1,
    }));
    
    set({
      event: {
        ...event,
        players: reindexedPlayers,
        updatedAt: Date.now(),
      },
    });
  },

  updatePlayerName: (playerId, name) => {
    const { event } = get();
    if (!event) return;
    
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    set({
      event: {
        ...event,
        players: event.players.map(p => 
          p.id === playerId ? { ...p, name: trimmedName } : p
        ),
        updatedAt: Date.now(),
      },
    });
  },

  randomizeSeating: () => {
    const { event } = get();
    if (!event) return;
    
    const shuffledPlayers = shuffleArray(event.players).map((p, i) => ({
      ...p,
      seatNumber: i + 1,
    }));
    
    set({
      event: {
        ...event,
        players: shuffledPlayers,
        updatedAt: Date.now(),
      },
    });
  },

  setPlayerDeckColors: (playerId, colors) => {
    const { event } = get();
    if (!event) return;
    
    set({
      event: {
        ...event,
        players: event.players.map(p => 
          p.id === playerId ? { ...p, deckColors: colors } : p
        ),
        updatedAt: Date.now(),
      },
    });
  },

  startEvent: () => {
    const { event } = get();
    if (!event) return;
    
    const nextPhase: EventPhase = event.type === 'draft' ? 'drafting' : 'deckbuilding';
    
    set({
      event: {
        ...event,
        currentPhase: nextPhase,
        deckbuildingState: nextPhase === 'deckbuilding' ? {
          timerStartedAt: null,
          timerPausedAt: null,
          timerDuration: event.settings.deckbuildingMinutes * 60,
          isPaused: true,
        } : null,
        updatedAt: Date.now(),
      },
    });
  },

  advanceToPhase: (phase) => {
    const { event } = get();
    if (!event) return;
    
    const updates: Partial<EventSession> = {
      currentPhase: phase,
      updatedAt: Date.now(),
    };
    
    if (phase === 'deckbuilding') {
      updates.deckbuildingState = {
        timerStartedAt: null,
        timerPausedAt: null,
        timerDuration: event.settings.deckbuildingMinutes * 60,
        isPaused: true,
      };
    }
    
    if (phase === 'rounds' && event.currentRound === 0) {
      updates.currentRound = 1;
    }
    
    set({ event: { ...event, ...updates } });
  },

  nextPack: () => {
    const { event } = get();
    if (!event?.draftState) return;
    
    const nextPackNum = (event.draftState.currentPack + 1) as 1 | 2 | 3;
    if (nextPackNum > 3) {
      // Move to deckbuilding
      get().advanceToPhase('deckbuilding');
      return;
    }
    
    set({
      event: {
        ...event,
        draftState: {
          ...event.draftState,
          currentPack: nextPackNum,
          passDirection: PACK_PASS_DIRECTION[nextPackNum],
          timerStartedAt: null,
          timerPausedAt: null,
          isPaused: true,
        },
        updatedAt: Date.now(),
      },
    });
  },

  setCurrentPack: (pack) => {
    const { event } = get();
    if (!event?.draftState) return;
    
    // Reset timer to default duration and auto-start when switching packs
    set({
      event: {
        ...event,
        draftState: {
          ...event.draftState,
          currentPack: pack,
          passDirection: PACK_PASS_DIRECTION[pack],
          // Reset timer and auto-start
          timerStartedAt: Date.now(),
          timerPausedAt: null,
          timerDuration: DEFAULT_SETTINGS.draftPickSeconds,
          isPaused: false,
          // Unmark complete if going back to earlier pack
          isComplete: false,
        },
        updatedAt: Date.now(),
      },
    });
  },

  markDraftComplete: () => {
    const { event } = get();
    if (!event?.draftState) return;
    
    set({
      event: {
        ...event,
        draftState: {
          ...event.draftState,
          isComplete: true,
          isPaused: true,
        },
        updatedAt: Date.now(),
      },
    });
  },

  startTimer: () => {
    const { event } = get();
    if (!event) return;
    
    if (event.currentPhase === 'drafting' && event.draftState) {
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerStartedAt: Date.now(),
            isPaused: false,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'deckbuilding' && event.deckbuildingState) {
      set({
        event: {
          ...event,
          deckbuildingState: {
            ...event.deckbuildingState,
            timerStartedAt: Date.now(),
            isPaused: false,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'rounds') {
      const currentRoundIndex = event.rounds.findIndex(
        r => r.roundNumber === event.currentRound
      );
      if (currentRoundIndex === -1) return;
      
      const updatedRounds = [...event.rounds];
      updatedRounds[currentRoundIndex] = {
        ...updatedRounds[currentRoundIndex],
        timerStartedAt: Date.now(),
        isPaused: false,
      };
      
      set({
        event: {
          ...event,
          rounds: updatedRounds,
          updatedAt: Date.now(),
        },
      });
    }
  },

  pauseTimer: () => {
    const { event } = get();
    if (!event) return;
    
    if (event.currentPhase === 'drafting' && event.draftState) {
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerPausedAt: Date.now(),
            isPaused: true,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'deckbuilding' && event.deckbuildingState) {
      set({
        event: {
          ...event,
          deckbuildingState: {
            ...event.deckbuildingState,
            timerPausedAt: Date.now(),
            isPaused: true,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'rounds') {
      const currentRoundIndex = event.rounds.findIndex(
        r => r.roundNumber === event.currentRound
      );
      if (currentRoundIndex === -1) return;
      
      const updatedRounds = [...event.rounds];
      updatedRounds[currentRoundIndex] = {
        ...updatedRounds[currentRoundIndex],
        timerPausedAt: Date.now(),
        isPaused: true,
      };
      
      set({
        event: {
          ...event,
          rounds: updatedRounds,
          updatedAt: Date.now(),
        },
      });
    }
  },

  resumeTimer: () => {
    const { event } = get();
    if (!event) return;
    
    if (event.currentPhase === 'drafting' && event.draftState) {
      const pausedDuration = event.draftState.timerPausedAt && event.draftState.timerStartedAt
        ? event.draftState.timerPausedAt - event.draftState.timerStartedAt
        : 0;
      
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerStartedAt: Date.now() - pausedDuration,
            timerPausedAt: null,
            isPaused: false,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'deckbuilding' && event.deckbuildingState) {
      const pausedDuration = event.deckbuildingState.timerPausedAt && event.deckbuildingState.timerStartedAt
        ? event.deckbuildingState.timerPausedAt - event.deckbuildingState.timerStartedAt
        : 0;
      
      set({
        event: {
          ...event,
          deckbuildingState: {
            ...event.deckbuildingState,
            timerStartedAt: Date.now() - pausedDuration,
            timerPausedAt: null,
            isPaused: false,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'rounds') {
      const currentRoundIndex = event.rounds.findIndex(
        r => r.roundNumber === event.currentRound
      );
      if (currentRoundIndex === -1) return;
      
      const round = event.rounds[currentRoundIndex];
      const pausedDuration = round.timerPausedAt && round.timerStartedAt
        ? round.timerPausedAt - round.timerStartedAt
        : 0;
      
      const updatedRounds = [...event.rounds];
      updatedRounds[currentRoundIndex] = {
        ...round,
        timerStartedAt: Date.now() - pausedDuration,
        timerPausedAt: null,
        isPaused: false,
      };
      
      set({
        event: {
          ...event,
          rounds: updatedRounds,
          updatedAt: Date.now(),
        },
      });
    }
  },

  adjustTimer: (seconds) => {
    const { event } = get();
    if (!event) return;
    
    if (event.currentPhase === 'drafting' && event.draftState) {
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerDuration: Math.max(10, event.draftState.timerDuration + seconds),
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'deckbuilding' && event.deckbuildingState) {
      set({
        event: {
          ...event,
          deckbuildingState: {
            ...event.deckbuildingState,
            timerDuration: Math.max(60, event.deckbuildingState.timerDuration + seconds),
          },
          updatedAt: Date.now(),
        },
      });
    }
  },

  resetTimer: () => {
    const { event } = get();
    if (!event) return;
    
    if (event.currentPhase === 'drafting' && event.draftState) {
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerStartedAt: null,
            timerPausedAt: null,
            isPaused: true,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'deckbuilding' && event.deckbuildingState) {
      set({
        event: {
          ...event,
          deckbuildingState: {
            timerStartedAt: null,
            timerPausedAt: null,
            isPaused: true,
          },
          updatedAt: Date.now(),
        },
      });
    }
  },

  generatePairings: (roundNumber) => {
    const { event } = get();
    if (!event) return;
    
    // Import and use Swiss pairing
    import('./swiss').then(({ generateSwissPairings }) => {
      const pairings = generateSwissPairings(event.players, event.rounds);
      
      const matches = pairings.map((pairing, index) => ({
        id: createMatchId(),
        tableNumber: index + 1,
        playerAId: pairing[0],
        playerBId: pairing[1],
        result: pairing[1] === null ? { playerAWins: 2, playerBWins: 0, isDraw: false } : null,
      }));
      
      const newRound: Round = {
        roundNumber,
        matches,
        isComplete: false,
        timerStartedAt: null,
        timerPausedAt: null,
        timerDuration: event.settings.roundTimerMinutes * 60,
        isPaused: true,
      };
      
      set({
        event: {
          ...event,
          rounds: [...event.rounds, newRound],
          currentRound: roundNumber,
          updatedAt: Date.now(),
        },
      });
    });
  },

  updateMatchResult: (matchId, result) => {
    const { event } = get();
    if (!event) return;
    
    const updatedRounds = event.rounds.map(round => ({
      ...round,
      matches: round.matches.map(match =>
        match.id === matchId ? { ...match, result } : match
      ),
    }));
    
    set({
      event: {
        ...event,
        rounds: updatedRounds,
        updatedAt: Date.now(),
      },
    });
  },

  finalizeRound: () => {
    const { event } = get();
    if (!event) return;
    
    const currentRoundIndex = event.rounds.findIndex(
      r => r.roundNumber === event.currentRound
    );
    if (currentRoundIndex === -1) return;
    
    const updatedRounds = [...event.rounds];
    updatedRounds[currentRoundIndex] = {
      ...updatedRounds[currentRoundIndex],
      isComplete: true,
    };
    
    const isLastRound = event.currentRound >= event.settings.totalRounds;
    
    set({
      event: {
        ...event,
        rounds: updatedRounds,
        currentPhase: isLastRound ? 'complete' : 'rounds',
        updatedAt: Date.now(),
      },
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

