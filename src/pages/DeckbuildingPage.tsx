import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, Plus, RotateCcw, Pause, Play, Settings, Lock, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { Button, clearHostAuth } from '@/components/ui';
import { TimerDisplay } from '@/components/timer';
import { useEventStore } from '@/lib/store';
import { useTimerMinutes } from '@/hooks/useTimer';
import { getEventSession, updateEventSession } from '@/lib/api';
import { parseCompositeId, createCompositeId } from '@/lib/generateId';
import { cn } from '@/lib/cn';

export const DeckbuildingPage = () => {
  const navigate = useNavigate();
  const { eventId: rawEventId } = useParams<{ eventId: string }>();
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Parse composite ID to get the actual event ID
  const eventId = rawEventId ? (parseCompositeId(rawEventId)?.id || rawEventId) : undefined;
  
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
    // Check if we need to load: no event, or event ID mismatch (switching events)
    const needsLoad = eventId && (!event || event.id !== eventId);
    if (needsLoad) {
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

  const getCompositeId = () => {
    if (!event) return '';
    return createCompositeId(event.eventCode, event.id);
  };

  const handleGoBack = () => {
    const compositeId = getCompositeId();
    if (event?.type === 'draft') {
      navigate(`/event/${compositeId}/draft`);
    } else {
      // Sealed - go to admin (requires password)
      clearHostAuth();
      navigate(`/event/${compositeId}`);
    }
  };

  const handleCopyLink = () => {
    const compositeId = getCompositeId();
    const shareUrl = `${window.location.origin}/event/${compositeId}/deckbuilding`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (!event) return;
    navigator.clipboard.writeText(event.eventCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

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
    navigate(`/event/${getCompositeId()}/round/1`);
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

  // Progress bar
  const totalDuration = event.settings.deckbuildingMinutes * 60;
  const elapsed = totalDuration - (minutes * 60 + seconds);
  const progress = Math.min(100, (elapsed / totalDuration) * 100);

  const isDraft = event.type === 'draft';
  const previousLabel = isDraft ? 'Drafting Stage' : 'Event Setup';
  const compositeId = getCompositeId();

  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-sm text-mist hover:text-snow transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {!isDraft && <Lock className="w-4 h-4 text-warning" />}
            <span className="text-xs text-mist uppercase">Previous</span>
            <span className="font-medium text-snow">{previousLabel}</span>
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

      {/* Share Link Bar */}
      <div className="bg-slate/50 border-b border-storm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-mist">Event Code:</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 bg-arcane/20 text-arcane font-mono text-lg font-bold px-3 py-1 rounded-lg hover:bg-arcane/30 transition-colors"
                >
                  {event.eventCode}
                  {codeCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-mist" />
              <code className="text-sm text-silver bg-slate px-3 py-1 rounded-lg font-mono">
                {window.location.origin}/event/{compositeId}/deckbuilding
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

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
