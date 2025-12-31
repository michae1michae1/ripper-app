import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sun, Minus, Plus, RotateCcw, Pause, Play, Lock, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { Button, Badge, clearHostAuth } from '@/components/ui';
import { TimerDisplay } from '@/components/timer';
import { PackIndicator, PassDirectionBadge, PodSeating } from '@/components/draft';
import { useEventStore } from '@/lib/store';
import { useTimerMinutes } from '@/hooks/useTimer';
import { getEventSession, updateEventSession } from '@/lib/api';

export const DraftPhasePage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [linkCopied, setLinkCopied] = useState(false);
  
  const {
    event,
    loadEvent,
    startTimer,
    pauseTimer,
    resumeTimer,
    adjustTimer,
    resetTimer,
    nextPack,
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

  const handleGoToAdmin = () => {
    // Clear auth so they have to enter password
    clearHostAuth();
    navigate(`/event/${event?.id}`);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/event/${event?.id}/draft`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleTimerToggle = async () => {
    if (!event) return;
    
    if (isRunning) {
      pauseTimer();
    } else if (event.draftState?.timerStartedAt) {
      resumeTimer();
    } else {
      startTimer();
    }
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleAdjust = async (secs: number) => {
    if (!event) return;
    adjustTimer(secs);
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleReset = async () => {
    if (!event) return;
    resetTimer();
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleNextPack = async () => {
    if (!event) return;
    nextPack();
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleSkipToDeckbuilding = async () => {
    if (!event) return;
    advanceToPhase('deckbuilding');
    await updateEventSession(event.id, useEventStore.getState().event!);
    navigate(`/event/${event.id}/deckbuilding`);
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const draftState = event.draftState!;

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToAdmin}
              className="flex items-center gap-2 p-2 text-mist hover:text-snow transition-colors"
              title="Admin access required"
            >
              <ArrowLeft className="w-5 h-5" />
              <Lock className="w-4 h-4 text-warning" />
            </button>
            <div>
              <span className="text-xs text-mist uppercase tracking-wide">Previous: Event Setup</span>
              <h1 className="font-semibold text-snow">{event.name}: Draft</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-mist uppercase tracking-wider">Drafting Stage</span>
            <Button variant="ghost" size="icon">
              <Sun className="w-5 h-5" />
            </Button>
            <button
              onClick={handleSkipToDeckbuilding}
              className="flex items-center gap-2 text-sm text-mist hover:text-snow transition-colors"
            >
              <span>Next</span>
              <span className="font-medium text-snow">Deckbuilding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Share Link Bar */}
      <div className="bg-slate/50 border-b border-storm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-mist">
            <LinkIcon className="w-4 h-4" />
            <span>Share this link with players:</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm text-silver bg-slate px-3 py-1 rounded-lg font-mono">
              {window.location.origin}/event/{event.id}/draft
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Timer Section */}
        <div className="bg-obsidian border border-storm rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <Badge variant="success" className="animate-pulse-soft">
                <span className="w-2 h-2 bg-success rounded-full mr-2" />
                DRAFTING NOW
              </Badge>
              
              <PackIndicator currentPack={draftState.currentPack} />
              
              <PassDirectionBadge direction={draftState.passDirection} />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <TimerDisplay
                  minutes={minutes}
                  seconds={seconds}
                  size="lg"
                  isExpired={isExpired}
                />
                <p className="text-sm text-mist mt-2 uppercase tracking-wider">Time Remaining</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAdjust(-10)}
                  title="Remove 10 seconds"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAdjust(10)}
                  title="Add 10 seconds"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="primary"
                onClick={handleTimerToggle}
                className="px-6"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause Draft
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Draft
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Pod Seating */}
        <PodSeating
          players={event.players}
          passDirection={draftState.passDirection}
        />

        {/* Event Log */}
        <div className="bg-obsidian border border-storm rounded-xl p-4">
          <h3 className="text-xs font-semibold text-mist uppercase tracking-wide mb-3">
            Event Log
          </h3>
          <div className="flex items-center gap-4 text-sm text-mist overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs text-mist/60">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="w-2 h-2 bg-arcane rounded-full" />
              <span>Pack {draftState.currentPack} started.</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {draftState.currentPack < 3 && (
            <Button variant="secondary" onClick={handleNextPack}>
              Complete Pack {draftState.currentPack} → Start Pack {draftState.currentPack + 1}
            </Button>
          )}
          <Button variant="primary" onClick={handleSkipToDeckbuilding}>
            Skip to Deckbuilding
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};
