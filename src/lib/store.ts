import { create } from 'zustand';
import type { 
  EventSession, 
  EventType, 
  Player, 
  EventPhase,
  EventStage,
  DraftState,
  DraftLogEntry,
  DraftLogType,
  Round,
  MatchResult,
  ManaColor 
} from '@/types/event';
import { createEventId, createEventCode, createPlayerId, createMatchId } from './generateId';
import { DEFAULT_SETTINGS, SEALED_DECKBUILDING_MINUTES, PACK_PASS_DIRECTION } from './constants';

/**
 * Derives the granular EventStage from an EventSession
 * Used for player view to know exactly what to display
 */
export function getCurrentStage(event: EventSession | null): EventStage | null {
  if (!event) return null;

  switch (event.currentPhase) {
    case 'setup':
      return 'setup:configuring';

    case 'drafting': {
      if (!event.draftState) return 'draft:pack1_paused';
      
      if (event.draftState.isComplete) {
        return 'draft:complete';
      }
      
      const pack = event.draftState.currentPack;
      const isPaused = event.draftState.isPaused;
      
      if (pack === 1) return isPaused ? 'draft:pack1_paused' : 'draft:pack1_active';
      if (pack === 2) return isPaused ? 'draft:pack2_paused' : 'draft:pack2_active';
      return isPaused ? 'draft:pack3_paused' : 'draft:pack3_active';
    }

    case 'deckbuilding': {
      if (!event.deckbuildingState) return 'deckbuilding:paused';
      
      // Check if explicitly marked complete
      if (event.deckbuildingState.isComplete) {
        return 'deckbuilding:complete';
      }
      
      // Check if timer has expired
      const { timerStartedAt, timerPausedAt, timerDuration, isPaused } = event.deckbuildingState;
      
      if (timerStartedAt) {
        const elapsed = isPaused && timerPausedAt
          ? (timerPausedAt - timerStartedAt) / 1000
          : (Date.now() - timerStartedAt) / 1000;
        
        if (elapsed >= timerDuration) {
          return 'deckbuilding:complete';
        }
      }
      
      return isPaused ? 'deckbuilding:paused' : 'deckbuilding:active';
    }

    case 'rounds': {
      const currentRound = event.rounds.find(r => r.roundNumber === event.currentRound);
      if (!currentRound) {
        return `round:${event.currentRound}_paused`;
      }
      
      // Check if all matches in this round have results (round complete)
      const allMatchesComplete = currentRound.matches.every(m => {
        // Bye matches are always complete
        if (m.playerBId === null) return true;
        return m.result !== null;
      });
      
      if (allMatchesComplete) {
        return `round:${event.currentRound}_complete`;
      }
      
      return currentRound.isPaused 
        ? `round:${event.currentRound}_paused`
        : `round:${event.currentRound}_active`;
    }

    case 'complete':
      return 'complete:final';

    default:
      return 'setup:configuring';
  }
}

interface EventStore {
  event: EventSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Pending stage for admin selection (not yet synced)
  pendingStage: EventStage | null;
  
  // Event lifecycle
  createEvent: (type: EventType, hostName: string) => EventSession;
  loadEvent: (event: EventSession) => void;
  clearEvent: () => void;
  resetEvent: () => void;
  updateEventCode: (newCode: string) => void;
  setEventSet: (code: string | null, name: string | null) => void;
  
  // Player management
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerName: (playerId: string, name: string) => void;
  randomizeSeating: () => void;
  setPlayerDeckColors: (playerId: string, colors: ManaColor[]) => void;
  
  // Phase transitions
  startEvent: () => void;
  advanceToPhase: (phase: EventPhase) => void;
  syncToStage: (targetStage: EventStage) => void;
  
  // Pending stage management (admin selects a state, but doesn't sync yet)
  setPendingStage: (stage: EventStage | null) => void;
  commitPendingStage: () => void;
  clearPendingStage: () => void;
  
  // Draft controls
  nextPack: () => void;
  setCurrentPack: (pack: 1 | 2 | 3) => void;
  markDraftComplete: () => void;
  addDraftLogEntry: (type: DraftLogType, message: string, data?: DraftLogEntry['data']) => void;
  
  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  adjustTimer: (seconds: number) => void;
  resetTimer: () => void;
  
  // Deckbuilding controls
  markDeckbuildingComplete: (isComplete: boolean) => void;
  
  // Round management
  generatePairings: (roundNumber: number) => void;
  updateMatchResult: (matchId: string, result: MatchResult) => void;
  finalizeRound: () => void;
  
  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function createDraftLogEntry(
  type: DraftLogType, 
  message: string, 
  data?: DraftLogEntry['data']
): DraftLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    message,
    data,
  };
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
    packStartedAt: null,
    eventLog: [],
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
  pendingStage: null,

  createEvent: (type, hostName) => {
    const event: EventSession = {
      id: createEventId(),
      eventCode: createEventCode(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type,
      name: type === 'draft' ? 'Booster Draft' : 'Sealed Deck',
      setCode: null,
      setName: null,
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

  setEventSet: (code, name) => {
    const { event } = get();
    if (!event) return;
    
    set({
      event: {
        ...event,
        setCode: code,
        setName: name,
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
          isComplete: false,
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
        isComplete: false,
      };
    }
    
    if (phase === 'rounds' && event.currentRound === 0) {
      updates.currentRound = 1;
    }
    
    set({ event: { ...event, ...updates } });
  },

  syncToStage: (targetStage) => {
    const { event } = get();
    if (!event) return;

    const now = Date.now();
    const updates: Partial<EventSession> = {
      updatedAt: now,
    };

    // Parse the target stage
    const [phaseGroup, stateInfo] = targetStage.split(':');

    // Set the current phase based on the target stage
    switch (phaseGroup) {
      case 'setup':
        updates.currentPhase = 'setup';
        break;

      case 'draft': {
        updates.currentPhase = 'drafting';
        
        // Parse pack and state info (e.g., "pack1_active", "complete")
        if (stateInfo === 'complete') {
          // Mark draft as complete
          updates.draftState = {
            ...(event.draftState || {
              currentPack: 3,
              passDirection: 'left',
              timerStartedAt: null,
              timerPausedAt: null,
              timerDuration: DEFAULT_SETTINGS.draftPickSeconds,
              packStartedAt: null,
              eventLog: [],
            }),
            currentPack: 3,
            isComplete: true,
            isPaused: true,
          } as DraftState;
        } else {
          // Parse pack number and paused/active state
          const packMatch = stateInfo.match(/pack(\d)_(active|paused)/);
          if (packMatch) {
            const packNum = parseInt(packMatch[1], 10) as 1 | 2 | 3;
            const isPaused = packMatch[2] === 'paused';
            
            updates.draftState = {
              currentPack: packNum,
              passDirection: PACK_PASS_DIRECTION[packNum],
              timerStartedAt: isPaused ? null : (event.draftState?.timerStartedAt || now),
              timerPausedAt: isPaused ? now : null,
              timerDuration: event.draftState?.timerDuration || DEFAULT_SETTINGS.draftPickSeconds,
              isPaused,
              isComplete: false,
              packStartedAt: event.draftState?.packStartedAt || (isPaused ? null : now),
              eventLog: event.draftState?.eventLog || [],
            };
          }
        }
        break;
      }

      case 'deckbuilding': {
        updates.currentPhase = 'deckbuilding';
        
        const isPaused = stateInfo === 'paused';
        const isComplete = stateInfo === 'complete';
        const isActive = stateInfo === 'active';
        
        updates.deckbuildingState = {
          timerStartedAt: isActive ? (event.deckbuildingState?.timerStartedAt || now) : event.deckbuildingState?.timerStartedAt || null,
          timerPausedAt: isPaused || isComplete ? (event.deckbuildingState?.timerPausedAt || now) : null,
          timerDuration: event.deckbuildingState?.timerDuration || event.settings.deckbuildingMinutes * 60,
          isPaused: isPaused || isComplete,
          isComplete,
        };
        break;
      }

      case 'round': {
        updates.currentPhase = 'rounds';
        
        // Parse round number and state (e.g., "1_active", "2_paused", "1_complete")
        const roundMatch = stateInfo.match(/(\d+)_(active|paused|complete)/);
        if (roundMatch) {
          const roundNum = parseInt(roundMatch[1], 10);
          const state = roundMatch[2];
          const isPaused = state === 'paused' || state === 'complete';
          const isComplete = state === 'complete';
          
          updates.currentRound = roundNum;
          
          // Pause any running timers on OTHER rounds when switching rounds
          updates.rounds = event.rounds.map(r => {
            if (r.roundNumber === roundNum) {
              // This is the target round
              return {
                ...r,
                isPaused,
                isComplete: isComplete || r.isComplete,
                timerStartedAt: isPaused ? r.timerStartedAt : (r.timerStartedAt || now),
                timerPausedAt: isPaused ? (r.timerPausedAt || now) : null,
              };
            } else if (r.timerStartedAt && !r.isPaused) {
              // Pause timers on other rounds
              return {
                ...r,
                isPaused: true,
                timerPausedAt: now,
              };
            }
            return r;
          });
          // If round doesn't exist, generatePairings will be called separately
        }
        break;
      }

      case 'complete':
        updates.currentPhase = 'complete';
        break;
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
    
    const prevPack = event.draftState.currentPack;
    const newLogEntries: DraftLogEntry[] = [];
    
    // If switching from a previous pack that was started, log its completion
    if (event.draftState.packStartedAt && pack !== prevPack) {
      const packDuration = Math.floor((Date.now() - event.draftState.packStartedAt) / 1000);
      newLogEntries.push(createDraftLogEntry(
        'pack_completed',
        `Pack ${prevPack} completed`,
        { pack: prevPack, duration: packDuration }
      ));
    }
    
    // Log new pack start
    newLogEntries.push(createDraftLogEntry(
      'pack_started',
      `Pack ${pack} started`,
      { pack }
    ));
    
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
          // Track when this pack started
          packStartedAt: Date.now(),
          eventLog: [...event.draftState.eventLog, ...newLogEntries],
        },
        updatedAt: Date.now(),
      },
    });
  },

  markDraftComplete: () => {
    const { event } = get();
    if (!event?.draftState) return;
    
    // Calculate pack 3 duration if it was started
    const packDuration = event.draftState.packStartedAt 
      ? Math.floor((Date.now() - event.draftState.packStartedAt) / 1000)
      : null;
    
    const newLogEntries: DraftLogEntry[] = [];
    
    // Add pack completion log if pack was started
    if (packDuration !== null) {
      newLogEntries.push(createDraftLogEntry(
        'pack_completed',
        `Pack 3 completed`,
        { pack: 3, duration: packDuration }
      ));
    }
    
    // Add draft completed log
    newLogEntries.push(createDraftLogEntry(
      'draft_completed',
      'Draft complete. Ready for deckbuilding.'
    ));
    
    set({
      event: {
        ...event,
        draftState: {
          ...event.draftState,
          isComplete: true,
          isPaused: true,
          packStartedAt: null,
          eventLog: [...event.draftState.eventLog, ...newLogEntries],
        },
        updatedAt: Date.now(),
      },
    });
  },

  addDraftLogEntry: (type, message, data) => {
    const { event } = get();
    if (!event?.draftState) return;
    
    const logEntry = createDraftLogEntry(type, message, data);
    
    set({
      event: {
        ...event,
        draftState: {
          ...event.draftState,
          eventLog: [...event.draftState.eventLog, logEntry],
        },
        updatedAt: Date.now(),
      },
    });
  },

  startTimer: () => {
    const { event } = get();
    if (!event) return;
    
    if (event.currentPhase === 'drafting' && event.draftState) {
      const isFirstStart = event.draftState.timerStartedAt === null;
      const now = Date.now();
      
      const newLogEntries: DraftLogEntry[] = [];
      if (isFirstStart) {
        newLogEntries.push(createDraftLogEntry(
          'draft_started',
          'Draft started'
        ));
        newLogEntries.push(createDraftLogEntry(
          'pack_started',
          'Pack 1 started',
          { pack: 1 }
        ));
      }
      
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerStartedAt: now,
            isPaused: false,
            packStartedAt: isFirstStart ? now : event.draftState.packStartedAt,
            eventLog: [...event.draftState.eventLog, ...newLogEntries],
          },
          updatedAt: now,
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
      const logEntry = createDraftLogEntry('timer_paused', 'Timer paused');
      
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerPausedAt: Date.now(),
            isPaused: true,
            eventLog: [...event.draftState.eventLog, logEntry],
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
      
      const logEntry = createDraftLogEntry('timer_resumed', 'Timer resumed');
      
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerStartedAt: Date.now() - pausedDuration,
            timerPausedAt: null,
            isPaused: false,
            eventLog: [...event.draftState.eventLog, logEntry],
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
      const direction = seconds > 0 ? 'added' : 'removed';
      const absSeconds = Math.abs(seconds);
      const logEntry = createDraftLogEntry(
        'timer_adjusted', 
        `${absSeconds}s ${direction}`,
        { adjustment: seconds }
      );
      
      set({
        event: {
          ...event,
          draftState: {
            ...event.draftState,
            timerDuration: Math.max(10, event.draftState.timerDuration + seconds),
            eventLog: [...event.draftState.eventLog, logEntry],
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
    } else if (event.currentPhase === 'rounds') {
      // Find the current round and adjust its timer
      const updatedRounds = event.rounds.map(round => {
        if (round.timerStartedAt && !round.isComplete) {
          return {
            ...round,
            timerDuration: Math.max(60, round.timerDuration + seconds),
          };
        }
        return round;
      });
      
      set({
        event: {
          ...event,
          rounds: updatedRounds,
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
            timerDuration: event.settings.deckbuildingMinutes * 60,
            isPaused: true,
            isComplete: false,
          },
          updatedAt: Date.now(),
        },
      });
    } else if (event.currentPhase === 'rounds') {
      // Reset the current round's timer (the round that hasn't ended yet)
      const updatedRounds = event.rounds.map(round => {
        if (!round.isComplete) {
          return {
            ...round,
            timerStartedAt: null,
            timerPausedAt: null,
            timerDuration: event.settings.roundTimerMinutes * 60,
            isPaused: true,
          };
        }
        return round;
      });
      
      set({
        event: {
          ...event,
          rounds: updatedRounds,
          updatedAt: Date.now(),
        },
      });
    }
  },

  markDeckbuildingComplete: (isComplete) => {
    const { event } = get();
    if (!event?.deckbuildingState) return;
    
    const now = Date.now();
    
    set({
      event: {
        ...event,
        deckbuildingState: {
          ...event.deckbuildingState,
          isComplete,
          // If marking complete, pause the timer and record the pause time
          isPaused: isComplete ? true : event.deckbuildingState.isPaused,
          timerPausedAt: isComplete ? now : event.deckbuildingState.timerPausedAt,
        },
        updatedAt: now,
      },
    });
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
  
  // Pending stage management
  setPendingStage: (stage) => set({ pendingStage: stage }),
  
  clearPendingStage: () => set({ pendingStage: null }),
  
  commitPendingStage: () => {
    const { pendingStage, syncToStage } = get();
    if (pendingStage) {
      syncToStage(pendingStage);
      set({ pendingStage: null });
    }
  },
}));

