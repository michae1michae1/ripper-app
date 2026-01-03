import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { PlayerMatchCard } from './PlayerMatchCard';
import { useTimerMinutes } from '@/hooks/useTimer';
import { cn } from '@/lib/cn';
import type { EventSession, Player, Match } from '@/types/event';

interface PlayerRoundViewProps {
  event: EventSession;
  player: Player;
  onResultReported: () => void;
}

export const PlayerRoundView = ({ event, player, onResultReported }: PlayerRoundViewProps) => {
  const currentRound = event.rounds.find(r => r.roundNumber === event.currentRound);
  
  // Find the player's match
  const playerMatch = currentRound?.matches.find(
    m => m.playerAId === player.id || m.playerBId === player.id
  );
  
  // Check if we're waiting for round data to sync (in rounds phase but no round object yet)
  const isWaitingForRoundData = event.currentPhase === 'rounds' && !currentRound;

  // Get opponent
  const getOpponent = (match: Match): Player | null => {
    if (!match) return null;
    const opponentId = match.playerAId === player.id ? match.playerBId : match.playerAId;
    if (!opponentId) return null; // Bye
    return event.players.find(p => p.id === opponentId) || null;
  };

  const opponent = playerMatch ? getOpponent(playerMatch) : null;

  // Timer state
  const timerState = currentRound ? {
    startedAt: currentRound.timerStartedAt,
    pausedAt: currentRound.timerPausedAt,
    duration: currentRound.timerDuration,
    isPaused: currentRound.isPaused,
  } : null;
  
  const { minutes, seconds, isRunning } = useTimerMinutes(timerState);
  const hasStarted = currentRound?.timerStartedAt !== null;

  // Handle bye
  if (playerMatch && !playerMatch.playerBId) {
    return (
      <div 
        data-component="PlayerRoundView"
        data-state="bye"
        className="player-round-view player-round-view--bye flex flex-col items-center px-4 pt-8 sm:pt-12"
      >
        {/* Round Header */}
        <div className="player-round-view__header text-center mb-8">
          <h2 className="player-round-view__title text-2xl sm:text-3xl font-bold text-snow mb-2">
            Round {event.currentRound}
          </h2>
          <p className="player-round-view__subtitle text-mist">
            of {event.settings.totalRounds}
          </p>
        </div>

        {/* Bye Message */}
        <div className="player-round-view__bye-card bg-success/10 border border-success/30 rounded-xl p-8 max-w-md text-center">
          <div className="player-round-view__bye-icon w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="player-round-view__bye-title text-xl font-semibold text-success mb-2">
            You Have a Bye!
          </h3>
          <p className="player-round-view__bye-text text-silver">
            Enjoy the break. You automatically win this round (2-0).
          </p>
        </div>

        {/* Table Info */}
        <div className="player-round-view__info bg-obsidian border border-storm rounded-xl p-4 mt-8 max-w-sm w-full">
          <div className="player-round-view__info-row flex items-center justify-between">
            <span className="player-round-view__info-label text-mist">Your Table</span>
            <span className="player-round-view__info-value text-snow font-semibold">
              Table {playerMatch?.tableNumber}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for round data to sync from admin
  if (isWaitingForRoundData) {
    return (
      <div 
        data-component="PlayerRoundView"
        data-state="loading"
        className="player-round-view player-round-view--loading flex flex-col items-center justify-center min-h-[60vh] px-4"
      >
        <Loader2 className="w-12 h-12 text-arcane mb-4 animate-spin" />
        <h2 className="player-round-view__loading-title text-xl font-semibold text-snow mb-2">
          Round {event.currentRound}
        </h2>
        <p className="player-round-view__loading-text text-mist">
          Setting up pairings...
        </p>
        <p className="player-round-view__loading-hint text-xs text-mist/60 mt-4">
          This page will update automatically
        </p>
      </div>
    );
  }

  // No match found for this player (shouldn't normally happen)
  if (!playerMatch || !currentRound) {
    return (
      <div 
        data-component="PlayerRoundView"
        data-state="error"
        className="player-round-view player-round-view--error flex flex-col items-center justify-center min-h-[60vh] px-4"
      >
        <AlertCircle className="w-12 h-12 text-warning mb-4" />
        <h2 className="player-round-view__error-title text-xl font-semibold text-snow mb-2">
          Match Not Found
        </h2>
        <p className="player-round-view__error-text text-mist">
          Unable to find your match for this round.
        </p>
      </div>
    );
  }

  return (
    <div 
      data-component="PlayerRoundView"
      data-round={event.currentRound}
      data-table={playerMatch.tableNumber}
      className="player-round-view flex flex-col items-center px-4 pt-8 sm:pt-12"
    >
      {/* Round Header */}
      <div className="player-round-view__header text-center mb-4">
        <h2 className="player-round-view__title text-2xl sm:text-3xl font-bold text-snow mb-1">
          Round {event.currentRound}
        </h2>
        <p className="player-round-view__subtitle text-mist">
          of {event.settings.totalRounds}
        </p>
      </div>

      {/* Table Assignment */}
      <div className="player-round-view__table-badge bg-arcane/20 text-arcane px-4 py-2 rounded-full mb-8">
        <span className="font-semibold">Table {playerMatch.tableNumber}</span>
      </div>

      {/* Timer Display */}
      <div className="player-round-view__timer-section bg-obsidian border border-storm rounded-xl p-4 mb-8 max-w-sm w-full">
        <div className="player-round-view__timer-row flex items-center justify-between">
          <div className="player-round-view__timer-label flex items-center gap-2">
            <Clock className={cn(
              'w-5 h-5',
              isRunning ? 'text-success animate-pulse' : 'text-mist'
            )} />
            <span className="text-sm text-mist">Round Timer</span>
          </div>
          <div className={cn(
            'player-round-view__timer-value font-mono text-xl font-bold',
            isRunning ? 'text-snow' : 'text-mist'
          )}>
            {hasStarted ? (
              <>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </>
            ) : (
              <span className="text-warning">Not Started</span>
            )}
          </div>
        </div>
      </div>

      {/* Match Card */}
      <div className="player-round-view__match-card max-w-md w-full">
        <PlayerMatchCard
          match={playerMatch}
          eventId={event.id}
          currentPlayer={player}
          opponent={opponent}
          onResultReported={onResultReported}
        />
      </div>

      {/* Hint */}
      <p className="player-round-view__hint text-xs text-mist mt-6 text-center">
        This page updates automatically • Report your result when the match ends
      </p>
    </div>
  );
};

