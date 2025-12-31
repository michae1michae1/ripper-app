import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Minus, Plus, RotateCcw, Pause, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui';
import { TimerDisplay } from '@/components/timer';
import { useEventStore } from '@/lib/store';
import { useTimerMinutes } from '@/hooks/useTimer';
import { getEventSession, updateEventSession } from '@/lib/api';
import { cn } from '@/lib/cn';

export const DeckbuildingPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  
  const {
    event,
    loadEvent,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    advanceToPhase,
    generatePairings,
    setLoading,
    setError,
    isLoading,
  } = useEventStore();
  
  const timerState = event?.deckbuildingState ? {
    startedAt: event.deckbuildingState.timerStartedAt,
    pausedAt: event.deckbuildingState.timerPausedAt,
    duration: event.settings.deckbuildingMinutes * 60,
    isPaused: event.deckbuildingState.isPaused,
  } : null;
  
  const { minutes, seconds, isRunning, isExpired } = useTimerMinutes(timerState);

  useEffect(() => {
    if (eventId && !event) {
      setLoading(true);
      getEventSession(eventId).then(({ data, error }) => {
        if (data) {
          loadEvent(data);
        } else {
          setError(error || 'Event not found');
          navigate('/');
        }
      });
    }
  }, [eventId, event, loadEvent, setLoading, setError, navigate]);

  const handleTimerToggle = useCallback(async () => {
    if (!event) return;
    
    if (isRunning) {
      pauseTimer();
    } else if (event.deckbuildingState?.timerStartedAt) {
      resumeTimer();
    } else {
      startTimer();
    }
    await updateEventSession(event.id, useEventStore.getState().event!);
  }, [event, isRunning, pauseTimer, resumeTimer, startTimer]);

  const handleReset = useCallback(async () => {
    if (!event) return;
    resetTimer();
    await updateEventSession(event.id, useEventStore.getState().event!);
  }, [event, resetTimer]);

  const handleAdvanceToRounds = async () => {
    if (!event) return;
    advanceToPhase('rounds');
    generatePairings(1);
    await updateEventSession(event.id, useEventStore.getState().event!);
    navigate(`/event/${event.id}/round/1`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        handleTimerToggle();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleReset();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTimerToggle, handleReset]);

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const previousPath = event.type === 'draft'
    ? `/event/${event.id}/draft`
    : `/event/${event.id}`;

  // Progress bar
  const totalDuration = event.settings.deckbuildingMinutes * 60;
  const elapsed = totalDuration - (minutes * 60 + seconds);
  const progress = Math.min(100, (elapsed / totalDuration) * 100);

  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(previousPath)}
            className="flex items-center gap-2 text-sm text-mist hover:text-snow transition-colors"
          >
            <span className="text-xs text-mist uppercase">Previous Stage</span>
            <span className="font-medium text-snow">
              {event.type === 'draft' ? 'Drafting stage' : 'Event Setup'}
            </span>
          </button>
          
          <span className="text-sm text-mist uppercase tracking-wider">Deckbuilding Stage</span>
          
          <button
            onClick={handleAdvanceToRounds}
            className="flex items-center gap-2 text-sm text-mist hover:text-snow transition-colors"
          >
            <span className="text-xs text-mist uppercase">Next</span>
            <span className="font-medium text-snow">Round 1 Matches</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content - Centered Timer */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Timer Mode Toggle */}
        <div className="bg-slate rounded-full p-1 mb-8">
          <div className="flex">
            <button
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                event.type === 'draft'
                  ? 'bg-arcane text-white'
                  : 'text-mist hover:text-snow'
              )}
            >
              Draft (30m)
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                event.type === 'sealed'
                  ? 'bg-arcane text-white'
                  : 'text-mist hover:text-snow'
              )}
            >
              Sealed (45m)
            </button>
          </div>
        </div>

        {/* Large Timer */}
        <TimerDisplay
          minutes={minutes}
          seconds={seconds}
          size="xl"
          isExpired={isExpired}
        />

        {/* Progress Bar */}
        <div className="w-full max-w-lg mt-8 mb-12">
          <div className="h-1.5 bg-storm rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                isExpired ? 'bg-danger' : 'bg-arcane'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate/50 rounded-2xl p-2 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate rounded-lg p-1">
            <Button variant="ghost" size="icon" title="Remove 1 minute">
              <Minus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Add 1 minute">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="w-px h-8 bg-storm" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Reset timer (Esc)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="primary"
            onClick={handleTimerToggle}
            className="w-14 h-14 rounded-full p-0"
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Footer - Keyboard hints */}
      <footer className="border-t border-storm bg-obsidian/50 py-3">
        <div className="max-w-6xl mx-auto px-4 flex justify-end gap-4">
          <div className="flex items-center gap-2 text-xs text-mist">
            <kbd className="px-2 py-0.5 bg-slate rounded border border-storm font-mono">Space</kbd>
            <span>to pause</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-mist">
            <kbd className="px-2 py-0.5 bg-slate rounded border border-storm font-mono">Esc</kbd>
            <span>to reset</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

