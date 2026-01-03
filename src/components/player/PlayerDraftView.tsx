import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TimerDisplay } from '@/components/timer';
import { useTimerMinutes } from '@/hooks/useTimer';
import { cn } from '@/lib/cn';
import type { EventSession, Player } from '@/types/event';

interface PlayerDraftViewProps {
  event: EventSession;
  player: Player;
}

export const PlayerDraftView = ({ event, player }: PlayerDraftViewProps) => {
  const draftState = event.draftState;
  
  // If no draft state, show loading
  if (!draftState) {
    return (
      <div className="player-draft-view player-draft-view--loading flex items-center justify-center min-h-[60vh]">
        <div className="player-draft-view__loader animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const timerState = {
    startedAt: draftState.timerStartedAt,
    pausedAt: draftState.timerPausedAt,
    duration: draftState.timerDuration,
    isPaused: draftState.isPaused,
  };
  
  const { minutes, seconds, isRunning, isExpired } = useTimerMinutes(timerState);
  const isDraftComplete = draftState.isComplete;
  const hasStarted = draftState.timerStartedAt !== null;

  return (
    <div 
      data-component="PlayerDraftView"
      data-pack={draftState.currentPack}
      data-complete={isDraftComplete || undefined}
      className="player-draft-view flex flex-col items-center px-4 pt-8 sm:pt-12"
    >
      {/* Draft Status */}
      <div className="player-draft-view__status mb-6">
        {isDraftComplete ? (
          <div className="player-draft-view__complete-badge flex items-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Draft Complete</span>
          </div>
        ) : !hasStarted ? (
          <div className="player-draft-view__waiting-badge flex items-center gap-2 bg-warning/20 text-warning px-4 py-2 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-warning rounded-full" />
            <span className="font-semibold">Waiting to Start</span>
          </div>
        ) : isRunning ? (
          <div className="player-draft-view__active-badge flex items-center gap-2 bg-cyan-400/20 text-cyan-400 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="font-semibold">Drafting</span>
          </div>
        ) : (
          <div className="player-draft-view__paused-badge flex items-center gap-2 bg-danger/20 text-danger px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-danger rounded-full" />
            <span className="font-semibold">Paused</span>
          </div>
        )}
      </div>

      {/* Pack Progress */}
      <div className="player-draft-view__pack-progress flex items-center gap-4 mb-8">
        {[1, 2, 3].map((pack) => (
          <div
            key={pack}
            data-pack={pack}
            data-active={draftState.currentPack === pack || undefined}
            data-completed={draftState.currentPack > pack || undefined}
            className={cn(
              'player-draft-view__pack-indicator',
              'flex flex-col items-center gap-1'
            )}
          >
            <div className={cn(
              'player-draft-view__pack-dot w-4 h-4 rounded-full transition-all',
              draftState.currentPack === pack && 'bg-arcane scale-125',
              draftState.currentPack > pack && 'bg-success',
              draftState.currentPack < pack && 'bg-storm'
            )} />
            <span className={cn(
              'player-draft-view__pack-label text-xs uppercase tracking-wide',
              draftState.currentPack === pack ? 'text-snow font-semibold' : 'text-mist'
            )}>
              Pack {pack}
            </span>
          </div>
        ))}
      </div>

      {/* Timer Display */}
      {!isDraftComplete && (
        <div className="player-draft-view__timer-section bg-obsidian rounded-xl p-6 sm:p-8 shadow-lg shadow-black/20 mb-8">
          <TimerDisplay
            minutes={minutes}
            seconds={seconds}
            size="xl"
            isExpired={isExpired}
          />
        </div>
      )}

      {/* Pass Direction */}
      {!isDraftComplete && hasStarted && (
        <div className="player-draft-view__pass-direction flex items-center gap-3 bg-slate/50 rounded-lg px-4 py-3 mb-8">
          <span className="player-draft-view__pass-label text-sm font-medium text-mist uppercase tracking-wide">
            Passing
          </span>
          {draftState.passDirection === 'left' ? (
            <>
              <span className="player-draft-view__pass-text text-snow font-semibold">Left</span>
              <ArrowLeft className="player-draft-view__pass-icon w-5 h-5 text-snow" />
            </>
          ) : (
            <>
              <span className="player-draft-view__pass-text text-snow font-semibold">Right</span>
              <ArrowRight className="player-draft-view__pass-icon w-5 h-5 text-snow" />
            </>
          )}
        </div>
      )}

      {/* Player Info Card */}
      <div className="player-draft-view__info bg-obsidian border border-storm rounded-xl p-4 max-w-sm w-full">
        <div className="player-draft-view__info-header flex items-center justify-between">
          <span className="player-draft-view__seat-label text-xs uppercase tracking-wide text-mist">
            Your Seat
          </span>
          <span className="player-draft-view__seat-number text-2xl font-bold text-arcane">
            {player.seatNumber}
          </span>
        </div>
        <p className="player-draft-view__player-name text-snow font-medium mt-2">
          {player.name}
        </p>
      </div>

      {/* Complete Message */}
      {isDraftComplete && (
        <div className="player-draft-view__complete-message bg-success/10 border border-success/30 rounded-xl p-6 mt-8 max-w-md text-center">
          <h3 className="player-draft-view__complete-title text-lg font-semibold text-success mb-2">
            Draft Complete!
          </h3>
          <p className="player-draft-view__complete-text text-silver">
            Waiting for deckbuilding to begin. This page will update automatically.
          </p>
        </div>
      )}

      {/* Hint */}
      <p className="player-draft-view__hint text-xs text-mist mt-6 text-center">
        This page updates automatically • No controls needed
      </p>
    </div>
  );
};

