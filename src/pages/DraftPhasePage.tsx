import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sun, Minus, Plus, Lock, Link as LinkIcon, Copy, Check, Home, Play, Pause, Clock, CheckCircle2, Settings, Users } from 'lucide-react';
import { Button, clearHostAuth, OptionsDrawer } from '@/components/ui';
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
  const [optionsOpen, setOptionsOpen] = useState(false);
  
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
      <div 
        data-page="DraftPhasePage"
        data-state="loading"
        className="draft-page draft-page--loading min-h-screen flex items-center justify-center"
      >
        <div className="draft-page__loader animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const draftState = event.draftState!;
  const compositeId = getCompositeId();
  const isOnPack3 = draftState.currentPack === 3;
  const isDraftComplete = draftState.isComplete;

  // Status for navbar badge
  // When timer is hidden (!timerEnabled), treat as "in progress" since timer is not relevant
  const getStatusColor = () => {
    if (isDraftComplete) return 'bg-success';
    if (!draftStarted) return 'bg-warning';
    // If timer is disabled, always show "in progress" color
    if (!timerEnabled || isRunning) return 'bg-cyan-400';
    return 'bg-danger';
  };

  const getStatusText = (mobile = false) => {
    if (isDraftComplete) return mobile ? 'Complete' : 'Draft Complete';
    if (!draftStarted) return mobile ? 'Start' : 'Start Draft';
    // If timer is disabled, always show "in progress" status
    if (!timerEnabled || isRunning) return mobile ? 'Drafting' : 'Draft In Progress';
    return 'Paused';
  };

  return (
    <div 
      data-page="DraftPhasePage"
      data-event-id={event.id}
      data-pack={draftState.currentPack}
      data-draft-started={draftStarted || undefined}
      data-draft-complete={isDraftComplete || undefined}
      className="draft-page min-h-screen bg-midnight"
    >
      {/* Header */}
      <header className="draft-page__header border-b border-storm bg-obsidian/50">
        <div className="draft-page__header-container max-w-6xl mx-auto px-4 py-3">
          <div className="draft-page__header-row flex items-center justify-between relative">
            {/* Left: Previous + Home */}
            <div className="draft-page__nav-left flex items-center gap-4">
              <button
                onClick={handleGoToAdmin}
                className="draft-page__admin-link flex items-center gap-2 text-mist hover:text-snow transition-colors"
                title="Admin access required"
              >
                <ArrowLeft className="w-4 h-4" />
                <Lock className="w-3 h-3 text-warning" />
                <span className="text-xs uppercase tracking-wide hidden sm:inline">Event Setup</span>
              </button>
              <button
                onClick={handleGoHome}
                className="draft-page__home-btn p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            
            {/* Center: Status badge - clickable to start draft */}
            <button
              onClick={!draftStarted ? handleStartDraft : undefined}
              data-status={isDraftComplete ? 'complete' : draftStarted ? (isRunning ? 'running' : 'paused') : 'pending'}
              className={cn(
                "draft-page__status-badge",
                "flex items-center gap-2 absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full transition-all",
                !draftStarted && "bg-warning/20 hover:bg-warning/30 cursor-pointer",
                draftStarted && "cursor-default"
              )}
            >
              <span className={cn(
                "draft-page__status-indicator w-2 h-2 rounded-full",
                getStatusColor(),
                !draftStarted && "animate-pulse",
                isRunning && "animate-pulse"
              )} />
              <span className={cn(
                "draft-page__status-text text-sm uppercase tracking-widest font-semibold",
                !draftStarted && "text-warning",
                isDraftComplete && "text-success",
                draftStarted && !isDraftComplete && isRunning && "text-cyan-400",
                draftStarted && !isDraftComplete && !isRunning && "text-danger"
              )}>
                <span className="sm:hidden">{getStatusText(true)}</span>
                <span className="hidden sm:inline">{getStatusText()}</span>
              </span>
            </button>
            
            {/* Right: Options + Next Deckbuilding */}
            <div className="draft-page__nav-right flex items-center gap-4">
              {/* Settings button - both mobile and desktop */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="draft-page__options-btn"
                onClick={() => setOptionsOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <button
                onClick={handleMoveToDeckbuilding}
                disabled={!isDraftComplete}
                className={cn(
                  "draft-page__next-link flex items-center gap-2 text-sm transition-colors",
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

      {/* Share Link Bar - Hidden on mobile (moved to options drawer) */}
      <div className="draft-page__share-bar hidden sm:block bg-slate/50 border-b border-storm">
        <div className="draft-page__share-bar-container max-w-6xl mx-auto px-4 py-3">
          <div className="draft-page__share-bar-row flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="draft-page__event-code-section flex items-center gap-4">
              <div className="draft-page__event-code flex items-center gap-2">
                <span className="draft-page__event-code-label text-sm text-mist">Event Code:</span>
                <button
                  onClick={handleCopyCode}
                  className="draft-page__event-code-value flex items-center gap-2 bg-arcane/20 text-arcane font-mono text-lg font-bold px-3 py-1 rounded-lg hover:bg-arcane/30 transition-colors"
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
            <div className="draft-page__share-link flex items-center gap-2">
              <LinkIcon className="draft-page__share-link-icon w-4 h-4 text-mist" />
              <code className="draft-page__share-link-url text-sm text-silver bg-slate px-3 py-1 rounded-lg font-mono">
                {window.location.origin}/event/{compositeId}/draft
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="draft-page__copy-link-btn"
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
      <main className="draft-page__main max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Timer Section - Modern clean design with drop shadow */}
        <div 
          data-section="timer-section"
          className="draft-page__timer-section bg-obsidian rounded-xl p-6 shadow-lg shadow-black/20"
        >
          {/* Pack Breadcrumb - Full Width */}
          <div className="draft-page__pack-nav flex items-center mb-4">
            {/* Timer Toggle - Left of Pack 1 */}
            <button
              onClick={handleToggleTimerEnabled}
              data-enabled={timerEnabled || undefined}
              className={cn(
                "draft-page__timer-toggle p-2 rounded-lg transition-all mr-4",
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
              data-pack="1"
              data-active={draftState.currentPack === 1 || undefined}
              className={cn(
                "draft-page__pack-btn draft-page__pack-btn--pack1",
                "font-semibold transition-all whitespace-nowrap uppercase tracking-wide",
                draftState.currentPack === 1 && draftStarted && "text-xl text-snow",
                draftState.currentPack !== 1 && draftStarted && "text-sm text-mist hover:text-snow",
                !draftStarted && "text-sm text-mist/50 cursor-default"
              )}
            >
              Pack 1
            </button>
            
            {/* Connector line 1 - flex-1 to stretch */}
            <div className="draft-page__pack-connector flex-1 mx-4">
              <div
                data-completed={draftState.currentPack > 1 || undefined}
                className={cn(
                  'draft-page__pack-connector-line h-0.5 rounded-full transition-colors',
                  draftState.currentPack > 1 ? 'bg-arcane' : 'bg-storm'
                )}
              />
            </div>
            
            {/* Pack 2 - Text size changes when active */}
            <button
              onClick={() => handleSetPack(2)}
              disabled={!draftStarted}
              data-pack="2"
              data-active={draftState.currentPack === 2 || undefined}
              className={cn(
                "draft-page__pack-btn draft-page__pack-btn--pack2",
                "font-semibold transition-all whitespace-nowrap uppercase tracking-wide",
                draftState.currentPack === 2 && "text-xl text-snow",
                draftState.currentPack !== 2 && draftStarted && "text-sm text-mist hover:text-snow",
                !draftStarted && "text-sm text-mist/50 cursor-default"
              )}
            >
              Pack 2
            </button>
            
            {/* Connector line 2 - flex-1 to stretch */}
            <div className="draft-page__pack-connector flex-1 mx-4">
              <div
                data-completed={draftState.currentPack > 2 || undefined}
                className={cn(
                  'draft-page__pack-connector-line h-0.5 rounded-full transition-colors',
                  draftState.currentPack > 2 ? 'bg-arcane' : 'bg-storm'
                )}
              />
            </div>
            
            {/* Pack 3 - Text size changes when active */}
            <button
              onClick={() => handleSetPack(3)}
              disabled={!draftStarted}
              data-pack="3"
              data-active={draftState.currentPack === 3 || undefined}
              className={cn(
                "draft-page__pack-btn draft-page__pack-btn--pack3",
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
              data-complete={isDraftComplete || undefined}
              className={cn(
                "draft-page__complete-btn p-2 rounded-full transition-all ml-4",
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
            <div className="draft-page__timer-area flex flex-col items-center">
              <div className="draft-page__timer-controls flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAdjust(-10)}
                  title="Remove 10 seconds"
                  className="draft-page__timer-decrease text-mist hover:text-snow w-12 h-12"
                  disabled={!draftStarted}
                >
                  <Minus className="w-6 h-6" />
                </Button>
                
                <button
                  onClick={handleTimerToggle}
                  disabled={!draftStarted}
                  className={cn(
                    "draft-page__timer-display-btn relative group",
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
                    <div className="draft-page__timer-overlay absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-lg transition-opacity">
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
                  className="draft-page__timer-increase text-mist hover:text-snow w-12 h-12"
                  disabled={!draftStarted}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pod Seating - Hidden on mobile */}
        <div className="draft-page__pod-desktop hidden sm:block">
          <PodSeating
            players={event.players}
            passDirection={draftState.passDirection}
          />
        </div>

        {/* Mobile Info Bar - Simplified view */}
        <div className="draft-page__mobile-info sm:hidden flex items-center justify-center gap-4 py-4">
          <div className="draft-page__pass-direction inline-flex items-center gap-2 bg-slate/50 rounded-lg px-4 py-2.5">
            <span className="text-sm font-medium text-mist uppercase tracking-wide">Passing</span>
            {draftState.passDirection === 'left' ? (
              <>
                <span className="text-sm font-medium text-snow capitalize">{draftState.passDirection}</span>
                <ArrowLeft className="w-4 h-4 text-snow" />
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-snow capitalize">{draftState.passDirection}</span>
                <ArrowRight className="w-4 h-4 text-snow" />
              </>
            )}
          </div>
          <div className="draft-page__player-count inline-flex items-center gap-2 border border-storm rounded-full px-4 py-2.5">
            <Users className="w-5 h-5 text-mist" />
            <span className="text-sm font-medium text-snow">{event.players.length}</span>
            <span className="text-sm font-medium text-mist">Players</span>
          </div>
        </div>

        {/* Event Log - Clean design without container */}
        <div 
          data-section="event-log"
          className="draft-page__event-log space-y-2"
        >
          <h3 className="draft-page__event-log-title text-xs font-semibold text-mist uppercase tracking-wide">
            Event Log
          </h3>
          <div className="draft-page__event-log-entries flex items-center gap-6 text-sm text-mist overflow-x-auto pb-2 hide-scrollbar">
            {draftState.eventLog.length === 0 ? (
              <div className="draft-page__event-log-entry flex items-center gap-2 whitespace-nowrap">
                <span className="draft-page__event-log-time text-xs text-mist/60">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="draft-page__event-log-indicator w-2 h-2 bg-warning rounded-full animate-pulse" />
                <span className="draft-page__event-log-message">Waiting to start draft...</span>
              </div>
            ) : (
              [...draftState.eventLog].reverse().map((entry) => (
                <div 
                  key={entry.id} 
                  className="draft-page__event-log-entry flex items-center gap-2 whitespace-nowrap"
                  data-log-type={entry.type}
                >
                  <span className="draft-page__event-log-time text-xs text-mist/60">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={cn(
                    'draft-page__event-log-indicator w-2 h-2 rounded-full',
                    entry.type === 'draft_started' && 'bg-success',
                    entry.type === 'draft_completed' && 'bg-success',
                    entry.type === 'pack_started' && 'bg-arcane',
                    entry.type === 'pack_completed' && 'bg-cyan-400',
                    entry.type === 'timer_paused' && 'bg-warning',
                    entry.type === 'timer_resumed' && 'bg-success',
                    entry.type === 'timer_adjusted' && 'bg-mist'
                  )} />
                  <span className="draft-page__event-log-message">
                    {entry.message}
                    {entry.data?.duration !== undefined && (
                      <span className="text-mist/60 ml-1">
                        ({Math.floor(entry.data.duration / 60)}:{String(entry.data.duration % 60).padStart(2, '0')})
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Options Drawer/Modal */}
      <OptionsDrawer
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        eventCode={event.eventCode}
        eventLink={`${window.location.origin}/event/${compositeId}/draft`}
        eventId={event.id}
        onNavigateToAdmin={handleGoToAdmin}
        isMobile={typeof window !== 'undefined' && window.innerWidth < 640}
      />
    </div>
  );
};

