import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sun, BarChart3, Clock } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
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

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => previousRound 
              ? navigate(`/event/${compositeId}/round/${previousRound}`)
              : navigate(`/event/${compositeId}/deckbuilding`)
            }
            className="flex items-center gap-2 text-mist hover:text-snow transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">
              {previousRound ? `Round ${previousRound} Matches` : 'Deckbuilding'}
            </span>
          </button>
          
          <span className="text-sm text-mist uppercase tracking-wider">
            Round {roundNumber} Matches
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => isLastRound 
                ? navigate(`/event/${compositeId}/results`)
                : navigate(`/event/${compositeId}/round/${roundNumber + 1}`)
              }
              className="flex items-center gap-2 text-mist hover:text-snow transition-colors"
            >
              <span className="text-sm">
                {isLastRound ? 'Final Results' : `Round ${roundNumber + 1} Matches`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Button variant="ghost" size="icon">
              <Sun className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Round Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-snow italic">
                Round {roundNumber} of {event.settings.totalRounds}
              </h1>
              <Badge variant="warning">In Progress</Badge>
            </div>
            <p className="text-mist">
              Swiss Pairing System • {event.players.length} Players
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Timer */}
            <button
              onClick={handleTimerToggle}
              className="flex items-center gap-2 bg-slate rounded-full px-4 py-2 hover:bg-storm transition-colors"
            >
              <Clock className="w-4 h-4 text-mist" />
              <span className="font-mono text-snow">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-mist">remaining</span>
            </button>
            
            {/* Standings */}
            <Button
              variant="secondary"
              onClick={() => setShowStandings(true)}
            >
              <BarChart3 className="w-4 h-4" />
              Standings
            </Button>
          </div>
        </div>

        {/* Matches */}
        <div className="bg-obsidian border border-storm rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_auto_1fr] gap-4 px-4 py-3 bg-slate/50 text-xs text-mist uppercase tracking-wide">
            <span>Table</span>
            <span>Player A</span>
            <span className="text-center">Result</span>
            <span className="text-right">Player B</span>
          </div>
          
          {/* Matches */}
          <div className="divide-y divide-storm">
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
          <div className="px-4 py-3 bg-slate/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {waitingCount > 0 ? (
                <>
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <span className="text-sm text-mist">
                    Waiting for {waitingCount} match result{waitingCount > 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span className="text-sm text-success">
                    All results entered
                  </span>
                </>
              )}
            </div>
            <span className="text-xs text-mist">Last updated just now</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 p-4 bg-obsidian border border-storm rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-mist">
              {allResultsEntered 
                ? 'All results have been entered. Ready to proceed.'
                : 'All results must be entered to proceed.'
              }
            </p>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleSaveAndContinue}>
                Save & Continue Later
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalizeRound}
                disabled={!allResultsEntered}
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

