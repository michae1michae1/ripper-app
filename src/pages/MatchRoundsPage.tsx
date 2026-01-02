import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Home,
  Settings,
  Plus,
  Minus,
} from "lucide-react";
import { Button, OptionsDrawer } from "@/components/ui";
import { MatchCard, StandingsModal } from "@/components/rounds";
import { useEventStore } from "@/lib/store";
import { useTimerMinutes } from "@/hooks/useTimer";
import { calculateStandings } from "@/lib/swiss";
import { getEventSession, updateEventSession } from "@/lib/api";
import { parseCompositeId, createCompositeId } from "@/lib/generateId";
import { cn } from "@/lib/cn";
import type { MatchResult } from "@/types/event";

export const MatchRoundsPage = () => {
  const navigate = useNavigate();
  const { eventId: rawEventId, roundNum } = useParams<{
    eventId: string;
    roundNum: string;
  }>();
  const [showStandings, setShowStandings] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  // Parse composite ID to get the actual event ID
  const eventId = rawEventId
    ? parseCompositeId(rawEventId)?.id || rawEventId
    : undefined;

  const roundNumber = parseInt(roundNum || "1", 10);

  const {
    event,
    loadEvent,
    updateMatchResult,
    finalizeRound,
    generatePairings,
    startTimer,
    pauseTimer,
    resumeTimer,
    adjustTimer,
    setLoading,
    setError,
    isLoading,
  } = useEventStore();

  const currentRound = event?.rounds.find((r) => r.roundNumber === roundNumber);

  const timerState = currentRound
    ? {
        startedAt: currentRound.timerStartedAt,
        pausedAt: currentRound.timerPausedAt,
        duration: currentRound.timerDuration,
        isPaused: currentRound.isPaused,
      }
    : null;

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
          setError(error || "Event not found");
          navigate("/");
        }
      });
    }
  }, [eventId, event, loadEvent, setLoading, setError, navigate]);

  // Generate pairings if needed
  useEffect(() => {
    if (event && !currentRound && event.currentPhase === "rounds") {
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

  const handleAdjustTimer = async (seconds: number) => {
    if (!event || !currentRound?.timerStartedAt) return;
    adjustTimer(seconds);
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
    if (!event) return "";
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
  const getPlayer = (playerId: string) =>
    event.players.find((p) => p.id === playerId);

  const allMatchesFinal =
    currentRound?.matches.every((m) => {
      // Bye = always final
      if (m.playerBId === null) return true;
      // No result entered = not final
      if (!m.result) return false;
      // Draw = final
      if (m.result.isDraw) return true;
      // 3 games played = final
      return m.result.playerAWins + m.result.playerBWins === 3;
    }) ?? false;

  const waitingCount =
    currentRound?.matches.filter(
      (m) => m.result === null && m.playerBId !== null
    ).length ?? 0;

  const isLastRound = roundNumber >= event.settings.totalRounds;
  const previousRound = roundNumber > 1 ? roundNumber - 1 : null;

  // Status for navbar
  const getStatusColor = () => {
    if (allMatchesFinal) return "bg-success"; // Ready
    if (isRunning) return "bg-cyan-400"; // Playing
    if (currentRound?.timerStartedAt) return "bg-danger"; // Paused
    return "bg-warning"; // Waiting
  };

  const getStatusText = (mobile = false) => {
    if (allMatchesFinal) return mobile ? "Ready" : "Ready to Proceed";
    if (isRunning) return "Playing";
    if (currentRound?.timerStartedAt) return "Paused";
    return mobile ? "Waiting" : "Waiting to Start";
  };

  return (
    <div
      data-page="MatchRoundsPage"
      data-event-id={event.id}
      data-round={roundNumber}
      data-total-rounds={event.settings.totalRounds}
      data-all-entered={allMatchesFinal || undefined}
      className="rounds-page min-h-screen bg-midnight"
    >
      {/* Header */}
      <header className="rounds-page__header border-b border-storm bg-obsidian/50">
        <div className="rounds-page__header-container max-w-4xl mx-auto px-4 py-3">
          <div className="rounds-page__header-row flex items-center justify-between relative">
            {/* Left: Previous + Home */}
            <div className="rounds-page__nav-left flex items-center gap-4">
              <button
                onClick={() =>
                  previousRound
                    ? navigate(`/event/${compositeId}/round/${previousRound}`)
                    : navigate(`/event/${compositeId}/deckbuilding`)
                }
                className="rounds-page__back-link flex items-center gap-2 text-mist hover:text-snow transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide hidden sm:inline">
                  {previousRound ? `Round ${previousRound}` : "Deckbuilding"}
                </span>
              </button>
              <button
                onClick={() => navigate("/")}
                className="rounds-page__home-btn p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Status badge */}
            <div
              data-status={allMatchesFinal ? "complete" : "waiting"}
              className="rounds-page__status-badge flex items-center gap-2 absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full"
            >
              <span
                className={cn(
                  "rounds-page__status-indicator w-2 h-2 rounded-full",
                  getStatusColor(),
                  !allMatchesFinal && "animate-pulse"
                )}
              />
              <span
                className={cn(
                  "rounds-page__status-text text-sm uppercase tracking-widest font-semibold",
                  allMatchesFinal && "text-success",
                  !allMatchesFinal && isRunning && "text-cyan-400",
                  !allMatchesFinal &&
                    !isRunning &&
                    currentRound?.timerStartedAt &&
                    "text-danger",
                  !allMatchesFinal &&
                    !currentRound?.timerStartedAt &&
                    "text-warning"
                )}
              >
                <span className="sm:hidden">{getStatusText(true)}</span>
                <span className="hidden sm:inline">{getStatusText()}</span>
              </span>
            </div>

            {/* Right: Options + Next */}
            <div className="rounds-page__nav-right flex items-center gap-4">
              {/* Settings button - both mobile and desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="rounds-page__options-btn"
                onClick={() => setOptionsOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <button
                onClick={() => {
                  // On mobile, require all results before navigating
                  if (!allMatchesFinal && window.innerWidth < 640) return;
                  if (isLastRound) {
                    navigate(`/event/${compositeId}/results`);
                  } else {
                    navigate(`/event/${compositeId}/round/${roundNumber + 1}`);
                  }
                }}
                className={cn(
                  "rounds-page__next-link flex items-center gap-2 transition-colors",
                  // On mobile, disable if not all results entered
                  !allMatchesFinal
                    ? "text-mist/40 cursor-not-allowed sm:text-mist sm:hover:text-snow sm:cursor-pointer"
                    : "text-mist hover:text-snow"
                )}
              >
                <span className="text-xs uppercase tracking-wide hidden sm:inline">
                  Next
                </span>
                <span
                  className={cn(
                    "font-medium hidden sm:inline",
                    allMatchesFinal ? "text-snow" : "text-mist/40 sm:text-snow"
                  )}
                >
                  {isLastRound ? "Results" : `Round ${roundNumber + 1}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="rounds-page__main max-w-4xl mx-auto px-4 py-8">
        {/* Matches */}
        <div
          data-section="matches"
          className="rounds-page__matches-container bg-obsidian border border-storm rounded-xl overflow-hidden"
        >
          {/* Integrated Header - Round info, Timer, Standings */}
          <div className="rounds-page__matches-header px-3 sm:px-4 py-3 sm:py-4 bg-slate/50 flex items-center justify-between">
            <h1 className="rounds-page__round-title text-lg sm:text-2xl font-bold text-snow">
              <span className="sm:hidden">Round {roundNumber}</span>
              <span className="hidden sm:inline">
                Round {roundNumber} of {event.settings.totalRounds}
              </span>
            </h1>

            <div className="rounds-page__header-actions flex items-center gap-2 sm:gap-3">
              {/* Timer with integrated controls */}
              <div className="rounds-page__timer-container flex items-center gap-0.5 bg-slate rounded-lg border border-storm p-1">
                {/* Minus button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdjustTimer(-60);
                  }}
                  disabled={!currentRound?.timerStartedAt}
                  className={cn(
                    "rounds-page__timer-decrease w-5 h-5 flex items-center justify-center rounded transition-colors",
                    currentRound?.timerStartedAt
                      ? "text-mist hover:text-snow hover:bg-storm"
                      : "text-mist/30 cursor-not-allowed"
                  )}
                  title="Remove 1 minute"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* Timer Display (clickable to pause/resume) */}
                <button
                  onClick={handleTimerToggle}
                  className="rounds-page__timer-display-btn flex items-center gap-1.5 px-2 py-1 rounded hover:bg-storm transition-colors"
                >
                  <Clock
                    className={cn(
                      "w-4 h-4",
                      isRunning ? "text-success animate-pulse" : "text-red-500"
                    )}
                  />
                  <span
                    className={cn(
                      "rounds-page__timer-display font-mono text-sm sm:text-base font-medium",
                      isRunning ? "text-snow" : "text-mist"
                    )}
                  >
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}
                  </span>
                </button>

                {/* Plus button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdjustTimer(60);
                  }}
                  disabled={!currentRound?.timerStartedAt}
                  className={cn(
                    "rounds-page__timer-increase w-5 h-5 flex items-center justify-center rounded transition-colors",
                    currentRound?.timerStartedAt
                      ? "text-mist hover:text-snow hover:bg-storm"
                      : "text-mist/30 cursor-not-allowed"
                  )}
                  title="Add 1 minute"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Standings */}
              <Button
                variant="secondary"
                onClick={() => setShowStandings(true)}
                className="rounds-page__standings-btn px-2 sm:px-3 py-2"
              >
                <span className="text-sm sm:text-base">Standings</span>
              </Button>
            </div>
          </div>

          {/* Matches */}
          <div className="rounds-page__matches-list divide-y divide-storm">
            {currentRound?.matches.map((match) => {
              const playerA = getPlayer(match.playerAId);
              const playerB = match.playerBId
                ? getPlayer(match.playerBId)
                : null;

              if (!playerA) return null;

              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  tableNumber={match.tableNumber}
                  playerA={playerA}
                  playerB={playerB ?? null}
                  onUpdateResult={(result) =>
                    handleUpdateResult(match.id, result)
                  }
                  standings={standings}
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
                    Waiting for {waitingCount} match result
                    {waitingCount > 1 ? "s" : ""}
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
            <span className="rounds-page__matches-timestamp text-xs text-mist">
              Last updated just now
            </span>
          </div>
        </div>

        {/* Footer Actions - Hidden on mobile (navigate via header) */}
        <div
          data-section="actions"
          className="rounds-page__actions-bar hidden sm:block mt-8 p-4 bg-obsidian border border-storm rounded-xl"
        >
          <div className="rounds-page__actions-row flex items-center justify-between">
            <p className="rounds-page__actions-message text-mist">
              {allMatchesFinal
                ? "All results have been entered. Ready to proceed."
                : "All results must be entered to proceed."}
            </p>
            <div className="rounds-page__actions-buttons flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleSaveAndContinue}
                className="rounds-page__save-btn"
              >
                Save & Continue Later
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalizeRound}
                disabled={!allMatchesFinal}
                className="rounds-page__finalize-btn"
              >
                {isLastRound
                  ? "View Final Results"
                  : `Finalize Round ${roundNumber + 1}`}
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

      {/* Options Drawer/Modal */}
      <OptionsDrawer
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        eventCode={event.eventCode}
        eventLink={`${window.location.origin}/event/${compositeId}/round/${roundNumber}`}
        eventId={event.id}
        onNavigateToAdmin={() => {
          navigate(`/event/${compositeId}`);
        }}
        isMobile={typeof window !== "undefined" && window.innerWidth < 640}
      />
    </div>
  );
};
