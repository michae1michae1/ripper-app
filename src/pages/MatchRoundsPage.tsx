import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sun, BarChart3, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import { MatchCard, StandingsModal } from '@/components/rounds';
import { useEventStore } from '@/lib/store';
import { useTimerMinutes } from '@/hooks/useTimer';
import { calculateStandings } from '@/lib/swiss';
import { getEventSession, updateEventSession } from '@/lib/api';
import { parseCompositeId, createCompositeId } from '@/lib/generateId';
import type { MatchResult } from '@/types/event';

export const MatchRoundsPage = () => {
  const navigate = useNavigate();
  const { eventId: rawEventId, roundNum } = useParams<{ eventId: string; roundNum: string }>();
  const [showStandings, setShowStandings] = useState(false);
  
  // Parse composite ID to get the actual event ID
  const eventId = rawEventId ? (parseCompositeId(rawEventId)?.id || rawEventId) : undefined;
  
  const roundNumber = parseInt(roundNum || '1', 10);
  
  const {
    event,
    loadEvent,
    updateMatchResult,
    finalizeRound,
    generatePairings,
    startTimer,
    pauseTimer,
    resumeTimer,
    setLoading,
    setError,
    isLoading,
  } = useEventStore();

  const currentRound = event?.rounds.find(r => r.roundNumber === roundNumber);
  
  const timerState = currentRound ? {
    startedAt: currentRound.timerStartedAt,
    pausedAt: currentRound.timerPausedAt,
    duration: currentRound.timerDuration,
    isPaused: currentRound.isPaused,
  } : null;
  
  const { minutes, seconds, isRunning } = useTimerMinutes(timerState);

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

  // Generate pairings if needed
  useEffect(() => {
    if (event && !currentRound && event.currentPhase === 'rounds') {
      generatePairings(roundNumber);
      updateEventSession(event.id, useEventStore.getState().event!);
    }
  }, [event, currentRound, roundNumber, generatePairings]);

  const handleUpdateResult = async (matchId: string, result: MatchResult) => {
    if (!event) return;
    updateMatchResult(matchId, result);
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleTimerToggle = async () => {
    if (!event) return;
    
    if (isRunning) {
      pauseTimer();
    } else if (currentRound?.timerStartedAt) {
      resumeTimer();
    } else {
      startTimer();
    }
    await updateEventSession(event.id, useEventStore.getState().event!);
  };

  const handleFinalizeRound = async () => {
    if (!event) return;
    
    const isLastRound = roundNumber >= event.settings.totalRounds;
    
    finalizeRound();
    await updateEventSession(event.id, useEventStore.getState().event!);
    
    const compositeId = createCompositeId(event.eventCode, event.id);
    if (isLastRound) {
      navigate(`/event/${compositeId}/results`);
    } else {
      const nextRound = roundNumber + 1;
      generatePairings(nextRound);
      await updateEventSession(event.id, useEventStore.getState().event!);
      navigate(`/event/${compositeId}/round/${nextRound}`);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!event) return;
    await updateEventSession(event.id, event);
  };

  const getCompositeId = () => {
    if (!event) return '';
    return createCompositeId(event.eventCode, event.id);
  };

  if (isLoading || !event) {
    return (
      <div 
        data-page="MatchRoundsPage"
        data-state="loading"
        className="rounds-page rounds-page--loading min-h-screen flex items-center justify-center"
      >
        <div className="rounds-page__loader animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const compositeId = getCompositeId();
  const standings = calculateStandings(event.players, event.rounds);
  const getPlayer = (playerId: string) => event.players.find(p => p.id === playerId);
  
  const allResultsEntered = currentRound?.matches.every(m => 
    m.result !== null || m.playerBId === null
  ) ?? false;
  
  const waitingCount = currentRound?.matches.filter(m => 
    m.result === null && m.playerBId !== null
  ).length ?? 0;

  const isLastRound = roundNumber >= event.settings.totalRounds;
  const previousRound = roundNumber > 1 ? roundNumber - 1 : null;

  // Status for navbar
  const getStatusColor = () => {
    if (allResultsEntered) return 'bg-success';
    if (isRunning) return 'bg-cyan-400';
    return 'bg-warning';
  };

  const getStatusText = () => {
    if (allResultsEntered) return 'Ready to Proceed';
    if (waitingCount > 0) return `Waiting for ${waitingCount} Result${waitingCount > 1 ? 's' : ''}`;
    return 'In Progress';
  };

  return (
    <div 
      data-page="MatchRoundsPage"
      data-event-id={event.id}
      data-round={roundNumber}
      data-total-rounds={event.settings.totalRounds}
      data-all-entered={allResultsEntered || undefined}
      className="rounds-page min-h-screen bg-midnight"
    >
      {/* Header */}
      <header className="rounds-page__header border-b border-storm bg-obsidian/50">
        <div className="rounds-page__header-container max-w-4xl mx-auto px-4 py-3">
          <div className="rounds-page__header-row flex items-center justify-between relative">
            {/* Left: Previous + Home */}
            <div className="rounds-page__nav-left flex items-center gap-4">
              <button
                onClick={() => previousRound 
                  ? navigate(`/event/${compositeId}/round/${previousRound}`)
                  : navigate(`/event/${compositeId}/deckbuilding`)
                }
                className="rounds-page__back-link flex items-center gap-2 text-mist hover:text-snow transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide hidden sm:inline">
                  {previousRound ? `Round ${previousRound}` : 'Deckbuilding'}
                </span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="rounds-page__home-btn p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            
            {/* Center: Status badge */}
            <div 
              data-status={allResultsEntered ? 'complete' : 'waiting'}
              className="rounds-page__status-badge flex items-center gap-2 absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full"
            >
              <span className={`rounds-page__status-indicator w-2 h-2 rounded-full ${getStatusColor()} ${!allResultsEntered && 'animate-pulse'}`} />
              <span className={`rounds-page__status-text text-sm uppercase tracking-widest font-semibold ${allResultsEntered ? 'text-success' : 'text-warning'}`}>
                {getStatusText()}
              </span>
            </div>
            
            {/* Right: Theme + Next */}
            <div className="rounds-page__nav-right flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounds-page__theme-btn">
                <Sun className="w-5 h-5" />
              </Button>
              <button
                onClick={() => isLastRound 
                  ? navigate(`/event/${compositeId}/results`)
                  : navigate(`/event/${compositeId}/round/${roundNumber + 1}`)
                }
                className="rounds-page__next-link flex items-center gap-2 text-mist hover:text-snow transition-colors"
              >
                <span className="text-xs uppercase tracking-wide hidden sm:inline">Next</span>
                <span className="font-medium text-snow hidden sm:inline">
                  {isLastRound ? 'Results' : `Round ${roundNumber + 1}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="rounds-page__main max-w-4xl mx-auto px-4 py-8">
        {/* Round Header */}
        <div className="rounds-page__round-header flex items-start justify-between mb-8">
          <div className="rounds-page__round-info">
            <div className="rounds-page__round-title-row flex items-center gap-3 mb-2">
              <h1 className="rounds-page__round-title text-4xl font-bold text-snow">
                Round {roundNumber} of {event.settings.totalRounds}
              </h1>
            </div>
            <p className="rounds-page__round-subtitle text-mist">
              Swiss Pairing System • {event.players.length} Players
            </p>
          </div>
          
          <div className="rounds-page__round-actions flex items-center gap-3">
            {/* Timer */}
            <button
              onClick={handleTimerToggle}
              className="rounds-page__timer-btn flex items-center gap-2 bg-slate rounded-full px-4 py-2 hover:bg-storm transition-colors"
            >
              <Clock className="w-4 h-4 text-mist" />
              <span className="rounds-page__timer-display font-mono text-snow">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="rounds-page__timer-label text-xs text-mist">remaining</span>
            </button>
            
            {/* Standings */}
            <Button
              variant="secondary"
              onClick={() => setShowStandings(true)}
              className="rounds-page__standings-btn"
            >
              <BarChart3 className="w-4 h-4" />
              Standings
            </Button>
          </div>
        </div>

        {/* Matches */}
        <div 
          data-section="matches"
          className="rounds-page__matches-container bg-obsidian border border-storm rounded-xl overflow-hidden"
        >
          {/* Table Header */}
          <div className="rounds-page__matches-header grid grid-cols-[60px_1fr_auto_1fr] gap-4 px-4 py-3 bg-slate/50 text-xs text-mist uppercase tracking-wide">
            <span className="rounds-page__matches-header-table">Table</span>
            <span className="rounds-page__matches-header-player-a">Player A</span>
            <span className="rounds-page__matches-header-result text-center">Result</span>
            <span className="rounds-page__matches-header-player-b text-right">Player B</span>
          </div>
          
          {/* Matches */}
          <div className="rounds-page__matches-list divide-y divide-storm">
            {currentRound?.matches.map((match) => {
              const playerA = getPlayer(match.playerAId);
              const playerB = match.playerBId ? getPlayer(match.playerBId) : null;
              
              if (!playerA) return null;
              
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  tableNumber={match.tableNumber}
                  playerA={playerA}
                  playerB={playerB ?? null}
                  onUpdateResult={(result) => handleUpdateResult(match.id, result)}
                />
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="rounds-page__matches-footer px-4 py-3 bg-slate/30 flex items-center justify-between">
            <div className="rounds-page__matches-status flex items-center gap-2">
              {waitingCount > 0 ? (
                <>
                  <div className="rounds-page__matches-status-indicator rounds-page__matches-status-indicator--waiting w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <span className="rounds-page__matches-status-text text-sm text-mist">
                    Waiting for {waitingCount} match result{waitingCount > 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <>
                  <div className="rounds-page__matches-status-indicator rounds-page__matches-status-indicator--complete w-2 h-2 bg-success rounded-full" />
                  <span className="rounds-page__matches-status-text text-sm text-success">
                    All results entered
                  </span>
                </>
              )}
            </div>
            <span className="rounds-page__matches-timestamp text-xs text-mist">Last updated just now</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          data-section="actions"
          className="rounds-page__actions-bar mt-8 p-4 bg-obsidian border border-storm rounded-xl"
        >
          <div className="rounds-page__actions-row flex items-center justify-between">
            <p className="rounds-page__actions-message text-mist">
              {allResultsEntered 
                ? 'All results have been entered. Ready to proceed.'
                : 'All results must be entered to proceed.'
              }
            </p>
            <div className="rounds-page__actions-buttons flex items-center gap-3">
              <Button variant="secondary" onClick={handleSaveAndContinue} className="rounds-page__save-btn">
                Save & Continue Later
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalizeRound}
                disabled={!allResultsEntered}
                className="rounds-page__finalize-btn"
              >
                {isLastRound ? 'View Final Results' : `Finalize Round ${roundNumber + 1}`}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Standings Modal */}
      <StandingsModal
        isOpen={showStandings}
        onClose={() => setShowStandings(false)}
        standings={standings}
        players={event.players}
      />
    </div>
  );
};

