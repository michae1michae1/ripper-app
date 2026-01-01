import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sun, Minus, Plus, Lock, Link as LinkIcon, Copy, Check, Home, Play, Pause, Clock, CheckCircle2 } from 'lucide-react';
import { Button, clearHostAuth } from '@/components/ui';
import { TimerDisplay } from '@/components/timer';
import { PodSeating } from '@/components/draft';
import { useEventStore } from '@/lib/store';
import { useTimerMinutes } from '@/hooks/useTimer';
import { getEventSession, updateEventSession } from '@/lib/api';
import { parseCompositeId, createCompositeId } from '@/lib/generateId';
import { cn } from '@/lib/cn';

export const DraftPhasePage = () => {
  const navigate = useNavigate();
  const { eventId: rawEventId } = useParams<{ eventId: string }>();
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  
  // Parse composite ID to get the actual event ID
  const eventId = rawEventId ? (parseCompositeId(rawEventId)?.id || rawEventId) : undefined;
  
  const {
    event,
    loadEvent,
    startTimer,
    pauseTimer,
    resumeTimer,
    adjustTimer,
    setCurrentPack,
    markDraftComplete,
    advanceToPhase,
    setLoading,
    setError,
    isLoading,
  } = useEventStore();
  
  const timerState = event?.draftState ? {
    startedAt: event.draftState.timerStartedAt,
    pausedAt: event.draftState.timerPausedAt,
    duration: event.draftState.timerDuration,
    isPaused: event.draftState.isPaused,
  } : null;
  
  const { minutes, seconds, isRunning, isExpired } = useTimerMinutes(timerState);

  // Track if draft has been started (timer started at least once)
  const draftStarted = event?.draftState?.timerStartedAt !== null;

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

  const handleGoToAdmin = () => {
    clearHostAuth();
    navigate(`/event/${getCompositeId()}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleCopyLink = () => {
    const compositeId = getCompositeId();
    const shareUrl = `${window.location.origin}/event/${compositeId}/draft`;
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

  const handleStartDraft = async () => {
    if (!event) return;
    if (timerEnabled) {
      startTimer();
    } else {
      // When timer disabled, just mark as started without running timer
      startTimer();
      pauseTimer();
    }
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleTimerToggle = async () => {
    if (!event || !draftStarted) return;
    
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleAdjust = async (secs: number) => {
    if (!event || !draftStarted) return;
    adjustTimer(secs);
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleSetPack = async (pack: 1 | 2 | 3) => {
    if (!event || !draftStarted) return;
    setCurrentPack(pack);
    // If timer is disabled, pause immediately after switching
    if (!timerEnabled) {
      pauseTimer();
    }
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleToggleTimerEnabled = () => {
    setTimerEnabled(!timerEnabled);
    // If disabling timer while running, pause it
    if (timerEnabled && isRunning && event) {
      pauseTimer();
      updateEventSession(event.id, useEventStore.getState().event!);
    }
  };

  const handleMarkDraftComplete = async () => {
    if (!event || !draftStarted || draftState.currentPack !== 3) return;
    markDraftComplete();
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleMoveToDeckbuilding = async () => {
    if (!event || !draftState.isComplete) return;
    advanceToPhase('deckbuilding');
    await updateEventSession(event.id, useEventStore.getState().event!);
    navigate(`/event/${getCompositeId()}/deckbuilding`);
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const draftState = event.draftState!;
  const compositeId = getCompositeId();
  const isOnPack3 = draftState.currentPack === 3;
  const isDraftComplete = draftState.isComplete;

  // Status for navbar badge
  const getStatusColor = () => {
    if (isDraftComplete) return 'bg-success';
    if (!draftStarted) return 'bg-warning';
    if (isRunning) return 'bg-cyan-400';
    return 'bg-danger';
  };

  const getStatusText = () => {
    if (isDraftComplete) return 'Draft Complete';
    if (!draftStarted) return 'Start Draft';
    if (isRunning) return 'Draft In Progress';
    return 'Paused';
  };

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between relative">
            {/* Left: Previous + Home */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoToAdmin}
                className="flex items-center gap-2 text-mist hover:text-snow transition-colors"
                title="Admin access required"
              >
                <ArrowLeft className="w-4 h-4" />
                <Lock className="w-3 h-3 text-warning" />
                <span className="text-xs uppercase tracking-wide hidden sm:inline">Event Setup</span>
              </button>
              <button
                onClick={handleGoHome}
                className="p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            
            {/* Center: Status badge - clickable to start draft */}
            <button
              onClick={!draftStarted ? handleStartDraft : undefined}
              className={cn(
                "flex items-center gap-2 absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full transition-all",
                !draftStarted && "bg-warning/20 hover:bg-warning/30 cursor-pointer",
                draftStarted && "cursor-default"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                getStatusColor(),
                !draftStarted && "animate-pulse",
                isRunning && "animate-pulse"
              )} />
              <span className={cn(
                "text-sm uppercase tracking-widest font-semibold",
                !draftStarted && "text-warning",
                isDraftComplete && "text-success",
                draftStarted && !isDraftComplete && isRunning && "text-cyan-400",
                draftStarted && !isDraftComplete && !isRunning && "text-danger"
              )}>
                {getStatusText()}
              </span>
            </button>
            
            {/* Right: Theme + Next Deckbuilding */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Sun className="w-5 h-5" />
              </Button>
              <button
                onClick={handleMoveToDeckbuilding}
                disabled={!isDraftComplete}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isDraftComplete
                    ? "text-mist hover:text-snow" 
                    : "text-mist/40 cursor-not-allowed"
                )}
              >
                <span className="text-xs uppercase tracking-wide hidden sm:inline">Next</span>
                <span className={cn(
                  "font-medium hidden sm:inline",
                  isDraftComplete ? "text-snow" : "text-mist/40"
                )}>Deckbuilding</span>
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
                {window.location.origin}/event/{compositeId}/draft
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Timer Section - Modern clean design with drop shadow */}
        <div className="bg-obsidian rounded-xl p-6 shadow-lg shadow-black/20">
          {/* Pack Breadcrumb - Full Width */}
          <div className="flex items-center mb-4">
            {/* Timer Toggle - Left of Pack 1 */}
            <button
              onClick={handleToggleTimerEnabled}
              className={cn(
                "p-2 rounded-lg transition-all mr-4",
                timerEnabled 
                  ? "bg-arcane/20 text-arcane hover:bg-arcane/30" 
                  : "bg-slate text-mist/50 hover:text-mist"
              )}
              title={timerEnabled ? "Timer enabled - click to disable" : "Timer disabled - click to enable"}
            >
              <Clock className="w-5 h-5" />
            </button>

            {/* Pack 1 - Text size changes when active */}
            <button
              onClick={() => handleSetPack(1)}
              disabled={!draftStarted}
              className={cn(
                "font-semibold transition-all whitespace-nowrap uppercase tracking-wide",
                draftState.currentPack === 1 && draftStarted && "text-xl text-snow",
                draftState.currentPack !== 1 && draftStarted && "text-sm text-mist hover:text-snow",
                !draftStarted && "text-sm text-mist/50 cursor-default"
              )}
            >
              Pack 1
            </button>
            
            {/* Connector line 1 - flex-1 to stretch */}
            <div className="flex-1 mx-4">
              <div
                className={cn(
                  'h-0.5 rounded-full transition-colors',
                  draftState.currentPack > 1 ? 'bg-arcane' : 'bg-storm'
                )}
              />
            </div>
            
            {/* Pack 2 - Text size changes when active */}
            <button
              onClick={() => handleSetPack(2)}
              disabled={!draftStarted}
              className={cn(
                "font-semibold transition-all whitespace-nowrap uppercase tracking-wide",
                draftState.currentPack === 2 && "text-xl text-snow",
                draftState.currentPack !== 2 && draftStarted && "text-sm text-mist hover:text-snow",
                !draftStarted && "text-sm text-mist/50 cursor-default"
              )}
            >
              Pack 2
            </button>
            
            {/* Connector line 2 - flex-1 to stretch */}
            <div className="flex-1 mx-4">
              <div
                className={cn(
                  'h-0.5 rounded-full transition-colors',
                  draftState.currentPack > 2 ? 'bg-arcane' : 'bg-storm'
                )}
              />
            </div>
            
            {/* Pack 3 - Text size changes when active */}
            <button
              onClick={() => handleSetPack(3)}
              disabled={!draftStarted}
              className={cn(
                "font-semibold transition-all whitespace-nowrap uppercase tracking-wide",
                draftState.currentPack === 3 && "text-xl text-snow",
                draftState.currentPack !== 3 && draftStarted && "text-sm text-mist hover:text-snow",
                !draftStarted && "text-sm text-mist/50 cursor-default"
              )}
            >
              Pack 3
            </button>

            {/* Draft Complete Button - Right of Pack 3 */}
            <button
              onClick={handleMarkDraftComplete}
              disabled={!draftStarted || !isOnPack3 || isDraftComplete}
              className={cn(
                "p-2 rounded-full transition-all ml-4",
                isDraftComplete && "bg-success/20 text-success",
                !isDraftComplete && isOnPack3 && draftStarted && "bg-slate text-mist hover:text-snow hover:bg-slate/80",
                (!isOnPack3 || !draftStarted) && !isDraftComplete && "bg-slate/50 text-mist/30 cursor-not-allowed"
              )}
              title={isDraftComplete ? "Draft complete" : isOnPack3 ? "Mark draft as complete" : "Complete Pack 3 first"}
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>

          {/* Timer Area - Only show when timer is enabled */}
          {timerEnabled && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAdjust(-10)}
                  title="Remove 10 seconds"
                  className="text-mist hover:text-snow w-12 h-12"
                  disabled={!draftStarted}
                >
                  <Minus className="w-6 h-6" />
                </Button>
                
                <button
                  onClick={handleTimerToggle}
                  disabled={!draftStarted}
                  className={cn(
                    "relative group",
                    draftStarted && "cursor-pointer"
                  )}
                >
                  <TimerDisplay
                    minutes={minutes}
                    seconds={seconds}
                    size="lg"
                    isExpired={isExpired}
                  />
                  {/* Play/Pause overlay - only show when draft started */}
                  {draftStarted && (
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
                  onClick={() => handleAdjust(10)}
                  title="Add 10 seconds"
                  className="text-mist hover:text-snow w-12 h-12"
                  disabled={!draftStarted}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pod Seating - includes pass direction */}
        <PodSeating
          players={event.players}
          passDirection={draftState.passDirection}
        />

        {/* Event Log - Clean design without container */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-mist uppercase tracking-wide">
            Event Log
          </h3>
          <div className="flex items-center gap-6 text-sm text-mist overflow-x-auto pb-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs text-mist/60">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="w-2 h-2 bg-arcane rounded-full" />
              <span>
                {!draftStarted 
                  ? 'Waiting to start draft...' 
                  : isDraftComplete
                    ? 'Draft complete. Ready for deckbuilding.'
                    : `Pack ${draftState.currentPack} in progress.`
                }
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

