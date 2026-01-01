import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, Plus, Pause, Play, Lock, Link as LinkIcon, Copy, Check, Sun, Home } from 'lucide-react';
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
    adjustTimer,
    advanceToPhase,
    generatePairings,
    setLoading,
    setError,
    isLoading,
  } = useEventStore();
  
  const timerState = event?.deckbuildingState ? {
    startedAt: event.deckbuildingState.timerStartedAt,
    pausedAt: event.deckbuildingState.timerPausedAt,
    duration: event.deckbuildingState.timerDuration,
    isPaused: event.deckbuildingState.isPaused,
  } : null;
  
  const { minutes, seconds, isRunning, isExpired } = useTimerMinutes(timerState);

  // Track if deckbuilding has been started (timer started at least once)
  const deckbuildingStarted = event?.deckbuildingState?.timerStartedAt !== null;

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

  const handleGoHome = () => {
    navigate('/');
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

  const handleStartDeckbuilding = async () => {
    if (!event) return;
    startTimer();
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleTimerToggle = useCallback(async () => {
    if (!event || !deckbuildingStarted) return;
    
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    await updateEventSession(event.id, useEventStore.getState().event!);
  }, [event, deckbuildingStarted, isRunning, pauseTimer, resumeTimer]);

  const handleAdjust = async (secs: number) => {
    if (!event || !deckbuildingStarted) return;
    adjustTimer(secs);
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

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
      
      if (e.code === 'Space' && deckbuildingStarted) {
        e.preventDefault();
        handleTimerToggle();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTimerToggle, deckbuildingStarted]);

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const isDraft = event.type === 'draft';
  const previousLabel = isDraft ? 'Drafting' : 'Event Setup';
  const compositeId = getCompositeId();

  // Status for navbar badge
  const getStatusColor = () => {
    if (!deckbuildingStarted) return 'bg-warning';
    if (isExpired) return 'bg-success';
    if (isRunning) return 'bg-cyan-400';
    return 'bg-danger';
  };

  const getStatusText = () => {
    if (!deckbuildingStarted) return 'Start Deckbuilding';
    if (isExpired) return 'Time Complete';
    if (isRunning) return 'Building Decks';
    return 'Paused';
  };

  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between relative">
            {/* Left: Previous + Home */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-mist hover:text-snow transition-colors"
                title={!isDraft ? "Admin access required" : undefined}
              >
                <ArrowLeft className="w-4 h-4" />
                {!isDraft && <Lock className="w-3 h-3 text-warning" />}
                <span className="text-xs uppercase tracking-wide hidden sm:inline">{previousLabel}</span>
              </button>
              <button
                onClick={handleGoHome}
                className="p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            
            {/* Center: Status badge - clickable to start deckbuilding */}
            <button
              onClick={!deckbuildingStarted ? handleStartDeckbuilding : undefined}
              className={cn(
                "flex items-center gap-2 absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full transition-all",
                !deckbuildingStarted && "bg-warning/20 hover:bg-warning/30 cursor-pointer",
                deckbuildingStarted && "cursor-default"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                getStatusColor(),
                !deckbuildingStarted && "animate-pulse",
                isRunning && "animate-pulse"
              )} />
              <span className={cn(
                "text-sm uppercase tracking-widest font-semibold",
                !deckbuildingStarted && "text-warning",
                isExpired && "text-success",
                deckbuildingStarted && !isExpired && isRunning && "text-cyan-400",
                deckbuildingStarted && !isExpired && !isRunning && "text-danger"
              )}>
                {getStatusText()}
              </span>
            </button>
            
            {/* Right: Theme + Next Round */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Sun className="w-5 h-5" />
              </Button>
              <button
                onClick={handleAdvanceToRounds}
                className="flex items-center gap-2 text-sm text-mist hover:text-snow transition-colors"
              >
                <span className="text-xs uppercase tracking-wide hidden sm:inline">Next</span>
                <span className="font-medium text-snow hidden sm:inline">Round 1</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
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
        {/* Timer Section - Same style as Draft page */}
        <div className="bg-obsidian rounded-xl p-8 shadow-lg shadow-black/20">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAdjust(-60)}
                title="Remove 1 minute"
                className="text-mist hover:text-snow w-12 h-12"
                disabled={!deckbuildingStarted}
              >
                <Minus className="w-6 h-6" />
              </Button>
              
              <button
                onClick={handleTimerToggle}
                disabled={!deckbuildingStarted}
                className={cn(
                  "relative group",
                  deckbuildingStarted && "cursor-pointer"
                )}
              >
                <TimerDisplay
                  minutes={minutes}
                  seconds={seconds}
                  size="xl"
                  isExpired={isExpired}
                />
                {/* Play/Pause overlay - only show when deckbuilding started */}
                {deckbuildingStarted && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-lg transition-opacity">
                    {isRunning ? (
                      <Pause className="w-12 h-12 text-white" />
                    ) : (
                      <Play className="w-12 h-12 text-white" />
                    )}
                  </div>
                )}
              </button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAdjust(60)}
                title="Add 1 minute"
                className="text-mist hover:text-snow w-12 h-12"
                disabled={!deckbuildingStarted}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Keyboard hints */}
      <footer className="border-t border-storm bg-obsidian/50 py-3">
        <div className="max-w-6xl mx-auto px-4 flex justify-center">
          <div className="flex items-center gap-2 text-xs text-mist">
            <kbd className="px-2 py-0.5 bg-slate rounded border border-storm font-mono">Space</kbd>
            <span>to pause/resume</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
