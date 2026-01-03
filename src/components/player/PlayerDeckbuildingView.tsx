import { CheckCircle2 } from 'lucide-react';
import { TimerDisplay } from '@/components/timer';
import { useTimerMinutes } from '@/hooks/useTimer';
import { cn } from '@/lib/cn';
import type { EventSession, Player } from '@/types/event';

interface PlayerDeckbuildingViewProps {
  event: EventSession;
  player: Player;
}

export const PlayerDeckbuildingView = ({ event, player }: PlayerDeckbuildingViewProps) => {
  const deckbuildingState = event.deckbuildingState;
  
  // If no deckbuilding state, show loading
  if (!deckbuildingState) {
    return (
      <div className="player-deckbuilding-view player-deckbuilding-view--loading flex items-center justify-center min-h-[60vh]">
        <div className="player-deckbuilding-view__loader animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const timerState = {
    startedAt: deckbuildingState.timerStartedAt,
    pausedAt: deckbuildingState.timerPausedAt,
    duration: deckbuildingState.timerDuration,
    isPaused: deckbuildingState.isPaused,
  };
  
  const { minutes, seconds, isRunning, isExpired } = useTimerMinutes(timerState);
  const hasStarted = deckbuildingState.timerStartedAt !== null;
  
  // Check if deckbuilding is complete (either explicitly marked or timer expired)
  const isComplete = deckbuildingState.isComplete || isExpired;

  return (
    <div 
      data-component="PlayerDeckbuildingView"
      data-started={hasStarted || undefined}
      data-complete={isComplete || undefined}
      className="player-deckbuilding-view flex flex-col items-center px-4 pt-8 sm:pt-12"
    >
      {/* Title */}
      <h2 className="player-deckbuilding-view__title text-2xl sm:text-3xl font-bold text-snow mb-2">
        Deckbuilding
      </h2>
      <p className="player-deckbuilding-view__subtitle text-mist mb-8">
        {event.type === 'draft' ? 'Build your deck from drafted cards' : 'Build your deck from sealed pool'}
      </p>

      {/* Status Badge */}
      <div className="player-deckbuilding-view__status mb-6">
        {isComplete ? (
          <div className="player-deckbuilding-view__complete-badge flex items-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Deckbuilding Complete</span>
          </div>
        ) : !hasStarted ? (
          <div className="player-deckbuilding-view__waiting-badge flex items-center gap-2 bg-warning/20 text-warning px-4 py-2 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-warning rounded-full" />
            <span className="font-semibold">Waiting to Start</span>
          </div>
        ) : isRunning ? (
          <div className="player-deckbuilding-view__active-badge flex items-center gap-2 bg-cyan-400/20 text-cyan-400 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="font-semibold">Building Decks</span>
          </div>
        ) : (
          <div className="player-deckbuilding-view__paused-badge flex items-center gap-2 bg-danger/20 text-danger px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-danger rounded-full" />
            <span className="font-semibold">Paused</span>
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className="player-deckbuilding-view__timer-section bg-obsidian rounded-xl p-6 sm:p-8 shadow-lg shadow-black/20 mb-8">
        <TimerDisplay
          minutes={minutes}
          seconds={seconds}
          size="xl"
          isExpired={isComplete}
        />
      </div>

      {/* Player Info */}
      <div className="player-deckbuilding-view__info bg-obsidian border border-storm rounded-xl p-4 max-w-sm w-full">
        <div className="player-deckbuilding-view__info-header flex items-center justify-between">
          <span className="player-deckbuilding-view__player-label text-xs uppercase tracking-wide text-mist">
            Player
          </span>
          <span className={cn(
            'player-deckbuilding-view__seat-badge px-2 py-0.5 text-xs font-medium rounded-full',
            'bg-arcane/20 text-arcane'
          )}>
            Seat {player.seatNumber}
          </span>
        </div>
        <p className="player-deckbuilding-view__player-name text-xl font-semibold text-snow mt-2">
          {player.name}
        </p>
      </div>

      {/* Complete Message */}
      {isComplete && (
        <div className="player-deckbuilding-view__complete-message bg-success/10 border border-success/30 rounded-xl p-6 mt-8 max-w-md text-center">
          <h3 className="player-deckbuilding-view__complete-title text-lg font-semibold text-success mb-2">
            Deckbuilding Complete
          </h3>
          <p className="player-deckbuilding-view__complete-text text-silver">
            Waiting for rounds to begin. This page will update automatically when pairings are posted.
          </p>
        </div>
      )}

      {/* Hint */}
      <p className="player-deckbuilding-view__hint text-xs text-mist mt-6 text-center">
        This page updates automatically • No controls needed
      </p>
    </div>
  );
};

