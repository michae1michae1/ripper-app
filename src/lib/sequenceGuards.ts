import type { EventSession, EventStage } from '@/types/event';

export interface SequenceGuard {
  canTransition: boolean;
  reason?: string;
  isBackward?: boolean;
}

export interface SequenceDefinition {
  stage: EventStage;
  label: string;
  group: 'setup' | 'draft' | 'deckbuilding' | 'rounds' | 'complete';
}

// Full sequence of all possible event stages
export const FULL_SEQUENCE: SequenceDefinition[] = [
  { stage: 'setup:configuring', label: 'Setup', group: 'setup' },
  { stage: 'draft:pack1_paused', label: 'Pack 1 (Paused)', group: 'draft' },
  { stage: 'draft:pack1_active', label: 'Pack 1 (Active)', group: 'draft' },
  { stage: 'draft:pack2_paused', label: 'Pack 2 (Paused)', group: 'draft' },
  { stage: 'draft:pack2_active', label: 'Pack 2 (Active)', group: 'draft' },
  { stage: 'draft:pack3_paused', label: 'Pack 3 (Paused)', group: 'draft' },
  { stage: 'draft:pack3_active', label: 'Pack 3 (Active)', group: 'draft' },
  { stage: 'draft:complete', label: 'Draft Complete', group: 'draft' },
  { stage: 'deckbuilding:paused', label: 'Deckbuilding (Paused)', group: 'deckbuilding' },
  { stage: 'deckbuilding:active', label: 'Deckbuilding (Active)', group: 'deckbuilding' },
  { stage: 'deckbuilding:complete', label: 'Deckbuilding Complete', group: 'deckbuilding' },
  { stage: 'round:1_paused', label: 'Round 1 (Paused)', group: 'rounds' },
  { stage: 'round:1_active', label: 'Round 1 (Active)', group: 'rounds' },
  { stage: 'round:1_complete', label: 'Round 1 Complete', group: 'rounds' },
  { stage: 'round:2_paused', label: 'Round 2 (Paused)', group: 'rounds' },
  { stage: 'round:2_active', label: 'Round 2 (Active)', group: 'rounds' },
  { stage: 'round:2_complete', label: 'Round 2 Complete', group: 'rounds' },
  { stage: 'round:3_paused', label: 'Round 3 (Paused)', group: 'rounds' },
  { stage: 'round:3_active', label: 'Round 3 (Active)', group: 'rounds' },
  { stage: 'round:3_complete', label: 'Round 3 Complete', group: 'rounds' },
  { stage: 'complete:final', label: 'Event Complete', group: 'complete' },
];

// Sequences filtered by group
export const DRAFT_SEQUENCES = FULL_SEQUENCE.filter(s => s.group === 'draft');
export const DECKBUILDING_SEQUENCES = FULL_SEQUENCE.filter(s => s.group === 'deckbuilding');
export const ROUNDS_SEQUENCES = FULL_SEQUENCE.filter(s => s.group === 'rounds');

// Get the index of a stage in the full sequence
function getStageIndex(stage: EventStage): number {
  return FULL_SEQUENCE.findIndex(s => s.stage === stage);
}

// Check if transitioning backward
export function isBackwardTransition(currentStage: EventStage, targetStage: EventStage): boolean {
  const currentIndex = getStageIndex(currentStage);
  const targetIndex = getStageIndex(targetStage);
  return targetIndex < currentIndex;
}

// Check if all matches in a round have results
function allMatchesHaveResults(event: EventSession, roundNumber: number): boolean {
  const round = event.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) return false;
  
  return round.matches.every(m => {
    // Bye matches are always complete
    if (m.playerBId === null) return true;
    // Check if result exists
    return m.result !== null;
  });
}

// Main guard function - checks if a transition is allowed
export function canTransitionTo(
  event: EventSession,
  currentStage: EventStage,
  targetStage: EventStage
): SequenceGuard {
  // Same stage - no transition needed
  if (currentStage === targetStage) {
    return { canTransition: true };
  }

  const isBackward = isBackwardTransition(currentStage, targetStage);

  // Parse target stage components
  const targetGroup = targetStage.split(':')[0];
  
  // Check conditions based on target stage
  switch (targetGroup) {
    case 'draft': {
      // Need at least 2 players to start draft
      if (event.players.length < 2) {
        return { 
          canTransition: false, 
          reason: 'Need at least 2 players to start draft',
          isBackward 
        };
      }
      
      // For sealed events, can't go to draft
      if (event.type === 'sealed') {
        return {
          canTransition: false,
          reason: 'Sealed events skip the draft phase',
          isBackward
        };
      }
      
      return { canTransition: true, isBackward };
    }

    case 'deckbuilding': {
      // Need at least 2 players
      if (event.players.length < 2) {
        return { 
          canTransition: false, 
          reason: 'Need at least 2 players',
          isBackward 
        };
      }
      
      // For draft events, draft must be complete to move forward
      if (event.type === 'draft' && !isBackward) {
        if (!event.draftState?.isComplete) {
          return {
            canTransition: false,
            reason: 'Draft must be marked complete first',
            isBackward
          };
        }
      }
      
      return { canTransition: true, isBackward };
    }

    case 'round': {
      // Parse round number from stage (e.g., "round:1_active" -> 1)
      const roundMatch = targetStage.match(/round:(\d+)/);
      const targetRound = roundMatch ? parseInt(roundMatch[1], 10) : 1;
      
      // Need at least 2 players
      if (event.players.length < 2) {
        return { 
          canTransition: false, 
          reason: 'Need at least 2 players',
          isBackward 
        };
      }
      
      // Deckbuilding must be complete to move to rounds (forward)
      if (!isBackward && !event.deckbuildingState?.isComplete) {
        return {
          canTransition: false,
          reason: 'Deckbuilding must be marked complete first',
          isBackward
        };
      }
      
      // For round N+1, all matches in round N must have results
      if (!isBackward && targetRound > 1) {
        const previousRound = targetRound - 1;
        if (!allMatchesHaveResults(event, previousRound)) {
          return {
            canTransition: false,
            reason: `All matches in Round ${previousRound} must have results`,
            isBackward
          };
        }
      }
      
      return { canTransition: true, isBackward };
    }

    case 'complete': {
      // All rounds must have results
      const totalRounds = event.settings.totalRounds;
      for (let i = 1; i <= totalRounds; i++) {
        if (!allMatchesHaveResults(event, i)) {
          return {
            canTransition: false,
            reason: `All matches in Round ${i} must have results`,
            isBackward
          };
        }
      }
      
      return { canTransition: true, isBackward };
    }

    case 'setup': {
      // Can always go back to setup (but it's a backward transition)
      return { canTransition: true, isBackward };
    }

    default:
      return { canTransition: true, isBackward };
  }
}

// Get human-readable stage name
export function getStageName(stage: EventStage): string {
  const def = FULL_SEQUENCE.find(s => s.stage === stage);
  return def?.label || stage;
}

// Get group name for a stage
export function getStageGroup(stage: EventStage): string {
  const def = FULL_SEQUENCE.find(s => s.stage === stage);
  return def?.group || 'unknown';
}

// Get display name for a group
export function getGroupDisplayName(group: string): string {
  switch (group) {
    case 'setup': return 'Setup';
    case 'draft': return 'Draft';
    case 'deckbuilding': return 'Deckbuilding';
    case 'rounds': return 'Rounds';
    case 'complete': return 'Complete';
    default: return group;
  }
}

