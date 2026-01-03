import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, Home, Settings } from "lucide-react";
import {
  Button,
  Badge,
  Avatar,
  EditablePlayerName,
  OptionsDrawer,
} from "@/components/ui";
import { EventSequencePanel } from "@/components/admin";
import { useEventStore } from "@/lib/store";
import { calculateStandings } from "@/lib/swiss";
import { getEventSession } from "@/lib/api";
import { parseCompositeId, createCompositeId } from "@/lib/generateId";
import { FULL_SEQUENCE } from "@/lib/sequenceGuards";
import { MANA_COLORS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { ManaColor } from "@/types/event";

export const FinalScoreboardPage = () => {
  const navigate = useNavigate();
  const { eventId: rawEventId } = useParams<{ eventId: string }>();
  const [optionsOpen, setOptionsOpen] = useState(false);

  // Parse composite ID to get the actual event ID
  const eventId = rawEventId
    ? parseCompositeId(rawEventId)?.id || rawEventId
    : undefined;

  const {
    event,
    loadEvent,
    setPlayerDeckColors,
    setLoading,
    setError,
    isLoading,
  } = useEventStore();

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

  const toggleDeckColor = (playerId: string, color: ManaColor) => {
    const player = event?.players.find((p) => p.id === playerId);
    if (!player) return;

    const currentColors = player.deckColors || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter((c) => c !== color)
      : [...currentColors, color];

    setPlayerDeckColors(playerId, newColors);
  };

  if (isLoading || !event) {
    return (
      <div
        data-page="FinalScoreboardPage"
        data-state="loading"
        className="scoreboard-page scoreboard-page--loading min-h-screen flex items-center justify-center"
      >
        <div className="scoreboard-page__loader animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const standings = calculateStandings(event.players, event.rounds);
  const completedDate = new Date(event.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const lastRound = event.settings.totalRounds;
  const compositeId = createCompositeId(event.eventCode, event.id);

  // Get set name display - will use setName from event once we add that field
  const getSetDisplay = () => {
    if (event.setName && event.setCode) {
      return `${event.setName} (${event.setCode})`;
    }
    return event.type === "draft" ? "Booster Draft" : "Sealed Deck";
  };

  return (
    <div
      data-page="FinalScoreboardPage"
      data-event-id={event.id}
      className="scoreboard-page min-h-screen bg-midnight"
    >
      {/* Header */}
      <header className="scoreboard-page__header border-b border-storm bg-obsidian/50">
        <div className="scoreboard-page__header-container max-w-5xl mx-auto px-4 py-3">
          <div className="scoreboard-page__header-row flex items-center justify-between relative">
            {/* Left: Previous + Home */}
            <div className="scoreboard-page__nav-left flex items-center gap-4">
              <button
                onClick={() =>
                  navigate(`/event/${compositeId}/round/${lastRound}`)
                }
                className="scoreboard-page__back-link flex items-center gap-2 text-mist hover:text-snow transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide hidden sm:inline">
                  Round {lastRound}
                </span>
              </button>
              <button
                onClick={() => navigate("/")}
                className="scoreboard-page__home-btn p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Status badge */}
            <div className="scoreboard-page__status-badge flex items-center gap-2 absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full">
              <span className="scoreboard-page__status-indicator w-2 h-2 rounded-full bg-success" />
              <span className="scoreboard-page__status-text text-sm uppercase tracking-widest font-semibold text-success">
                <span className="sm:hidden">Complete</span>
                <span className="hidden sm:inline">Completed</span>
              </span>
            </div>

            {/* Right: Options */}
            <div className="scoreboard-page__nav-right flex items-center gap-2">
              {/* Settings button - both mobile and desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="scoreboard-page__options-btn"
                onClick={() => setOptionsOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="scoreboard-page__main max-w-5xl mx-auto px-4 py-8">
        {/* Event Info */}
        <div className="scoreboard-page__event-info mb-4 sm:mb-8">
          <h1 className="scoreboard-page__event-title text-xl sm:text-4xl font-bold mb-2 sm:mb-3">
            <span className="scoreboard-page__event-name text-snow">
              {event.name}
            </span>
            <span className="hidden sm:inline">: </span>
            <span className="scoreboard-page__event-set text-arcane italic block sm:inline text-lg sm:text-4xl">
              {getSetDisplay()}
            </span>
          </h1>
          {/* Desktop meta */}
          <div className="scoreboard-page__event-meta hidden sm:flex items-center gap-4 text-sm text-mist">
            <span className="scoreboard-page__meta-type flex items-center gap-2">
              <span className="w-4 h-4 bg-slate rounded flex items-center justify-center text-xs">
                📦
              </span>
              {event.type === "draft" ? "Booster Draft" : "Sealed Deck"}
            </span>
            <span className="scoreboard-page__meta-players">
              👥 {event.players.length} Players
            </span>
            <span className="scoreboard-page__meta-rounds">
              🏆 {event.settings.totalRounds} Rounds
            </span>
            <span className="scoreboard-page__meta-date">
              📅 {completedDate}
            </span>
          </div>
          {/* Mobile meta - simplified */}
          <div className="scoreboard-page__event-meta-mobile sm:hidden flex items-center gap-3 text-xs text-mist">
            <span>{event.players.length} players</span>
            <span>•</span>
            <span>{event.settings.totalRounds} rounds</span>
            <span>•</span>
            <span>{completedDate}</span>
          </div>
        </div>

        {/* Standings Table */}
        <div
          data-section="standings"
          className="scoreboard-page__standings-container bg-obsidian border border-storm rounded-xl overflow-hidden max-h-[600px] sm:max-h-none overflow-y-auto"
        >
          {/* Table Header - Desktop */}
          <div className="scoreboard-page__standings-header hidden sm:grid grid-cols-[60px_1fr_140px_120px_100px_60px] gap-4 px-4 py-3 bg-slate/50 text-xs text-mist uppercase tracking-wide">
            <span className="scoreboard-page__standings-header-rank">Rank</span>
            <span className="scoreboard-page__standings-header-player">
              Player
            </span>
            <span className="scoreboard-page__standings-header-colors text-center">
              Colors
            </span>
            <span className="scoreboard-page__standings-header-record text-center">
              Record
            </span>
            <span className="scoreboard-page__standings-header-stats text-right">
              Stats
            </span>
            <span className="scoreboard-page__standings-header-points text-right">
              Pts
            </span>
          </div>

          {/* Table Header - Mobile */}
          <div className="scoreboard-page__standings-header-mobile sm:hidden grid grid-cols-[32px_1fr_50px_50px_36px] gap-1 px-2 py-2 bg-slate/50 text-[10px] text-mist uppercase tracking-wide">
            <span className="scoreboard-page__standings-header-rank">#</span>
            <span className="scoreboard-page__standings-header-player">
              Player
            </span>
            <span className="scoreboard-page__standings-header-record text-center">
              Rec
            </span>
            <span className="scoreboard-page__standings-header-stats text-right">
              OMW
            </span>
            <span className="scoreboard-page__standings-header-points text-right">
              Pts
            </span>
          </div>

          {/* Rows */}
          <div className="scoreboard-page__standings-list divide-y divide-storm">
            {standings.map((standing, index) => {
              const player = event.players.find(
                (p) => p.id === standing.playerId
              );
              if (!player) return null;

              const rank = index + 1;
              const isWinner = rank === 1;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={standing.playerId}
                  data-rank={rank}
                  data-player-id={player.id}
                  data-winner={isWinner || undefined}
                  data-top3={isTop3 || undefined}
                  className={cn(
                    "scoreboard-page__standings-row",
                    isWinner && "scoreboard-page__standings-row--winner",
                    isTop3 &&
                      !isWinner &&
                      "scoreboard-page__standings-row--top3",
                    isWinner &&
                      "bg-gradient-to-r from-yellow-500/10 to-transparent border-l-2 border-yellow-500",
                    isTop3 && !isWinner && "bg-arcane/5"
                  )}
                >
                  {/* Desktop Row */}
                  <div className="scoreboard-page__standings-row-desktop hidden sm:grid grid-cols-[60px_1fr_140px_120px_100px_60px] gap-4 px-4 py-4 items-center">
                    {/* Rank */}
                    <div className="scoreboard-page__standings-rank flex items-center justify-center">
                      {isWinner ? (
                        <Trophy className="scoreboard-page__trophy-icon w-6 h-6 text-yellow-500" />
                      ) : (
                        <span
                          className={cn(
                            "scoreboard-page__rank-number text-lg font-bold",
                            isTop3 ? "text-snow" : "text-mist"
                          )}
                        >
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="scoreboard-page__standings-player flex items-center gap-3">
                      <div className="hidden sm:flex">
                        <Avatar name={player.name} size="md" />
                      </div>
                      <div className="scoreboard-page__player-info">
                        <EditablePlayerName
                          playerId={player.id}
                          name={player.name}
                          className="font-semibold text-snow"
                          size="md"
                        />
                      </div>
                    </div>

                    {/* Deck Colors */}
                    <div className="scoreboard-page__standings-colors flex items-center justify-center gap-1">
                      {(["W", "U", "B", "R", "G"] as ManaColor[]).map(
                        (color) => (
                          <button
                            key={color}
                            data-color={color}
                            data-selected={
                              player.deckColors?.includes(color) || undefined
                            }
                            onClick={() => toggleDeckColor(player.id, color)}
                            className={cn(
                              "scoreboard-page__color-btn",
                              "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                              player.deckColors?.includes(color)
                                ? "opacity-100"
                                : "opacity-30 hover:opacity-60"
                            )}
                            title={MANA_COLORS[color].name}
                          >
                            <img
                              src={MANA_COLORS[color].svg}
                              alt={MANA_COLORS[color].name}
                              className="w-6 h-6"
                            />
                          </button>
                        )
                      )}
                    </div>

                    {/* Record */}
                    <div className="scoreboard-page__standings-record flex justify-center">
                      <Badge
                        variant="muted"
                        className="scoreboard-page__record-badge font-mono"
                      >
                        {standing.wins}-{standing.losses}-{standing.draws}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="scoreboard-page__standings-stats text-right">
                      <p className="scoreboard-page__omw-stat text-sm text-snow">
                        {standing.opponentMatchWinPercentage.toFixed(1)}%
                        <span className="scoreboard-page__stat-label text-xs text-mist ml-1">
                          OMW
                        </span>
                      </p>
                      <p className="scoreboard-page__gw-stat text-xs text-mist">
                        {standing.gameWinPercentage.toFixed(1)}% GW
                      </p>
                    </div>

                    {/* Points */}
                    <div className="scoreboard-page__standings-points text-right">
                      <span
                        className={cn(
                          "scoreboard-page__points-value text-2xl font-bold",
                          standing.points > 0 ? "text-arcane" : "text-mist"
                        )}
                      >
                        {standing.points}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Row */}
                  <div className="scoreboard-page__standings-row-mobile sm:hidden grid grid-cols-[32px_1fr_50px_50px_36px] gap-1 px-2 py-2 items-center">
                    {/* Rank */}
                    <div className="scoreboard-page__standings-rank flex items-center justify-center">
                      {isWinner ? (
                        <Trophy className="scoreboard-page__trophy-icon w-4 h-4 text-yellow-500" />
                      ) : (
                        <span
                          className={cn(
                            "scoreboard-page__rank-number text-sm font-bold",
                            isTop3 ? "text-snow" : "text-mist"
                          )}
                        >
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Player - No avatar on mobile */}
                    <div className="scoreboard-page__standings-player min-w-0">
                      <EditablePlayerName
                        playerId={player.id}
                        name={player.name}
                        className="font-semibold text-snow text-sm truncate"
                        size="sm"
                      />
                    </div>

                    {/* Record */}
                    <div className="scoreboard-page__standings-record text-center">
                      <span className="text-xs font-mono text-silver">
                        {standing.wins}-{standing.losses}-{standing.draws}
                      </span>
                    </div>

                    {/* OMW% */}
                    <div className="scoreboard-page__standings-stats text-right">
                      <span className="text-xs text-mist">
                        {standing.opponentMatchWinPercentage.toFixed(0)}%
                      </span>
                    </div>

                    {/* Points */}
                    <div className="scoreboard-page__standings-points text-right">
                      <span
                        className={cn(
                          "scoreboard-page__points-value text-base font-bold",
                          standing.points > 0 ? "text-arcane" : "text-mist"
                        )}
                      >
                        {standing.points}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend - Hidden on mobile */}
        <div className="scoreboard-page__legend hidden sm:flex mt-6 items-center justify-between text-xs text-mist">
          <div className="scoreboard-page__legend-left flex items-center gap-4">
            <div className="scoreboard-page__legend-colors flex items-center gap-2">
              {(["W", "U", "B", "R", "G"] as ManaColor[]).map((color) => (
                <img
                  key={color}
                  src={MANA_COLORS[color].svg}
                  alt={MANA_COLORS[color].name}
                  className="scoreboard-page__legend-color-icon w-4 h-4"
                />
              ))}
              <span className="scoreboard-page__legend-colors-label">
                Deck Colors
              </span>
            </div>
            <span className="scoreboard-page__legend-omw">
              <strong>OMW%</strong> Opponent Match Win %
            </span>
          </div>
          <span className="scoreboard-page__legend-scoring">
            Official DCI Scoring
          </span>
        </div>

        {/* Mobile Legend - Simplified */}
        <div className="scoreboard-page__legend-mobile sm:hidden mt-4 text-center text-xs text-mist">
          <span>
            <strong>OMW</strong> = Opponent Match Win %
          </span>
        </div>

        {/* Footer */}
        <div className="scoreboard-page__copyright mt-8 text-center text-sm text-mist">
          <p>
            © {new Date().getFullYear()} Ripper Limit. Built for the community.
          </p>
        </div>

        {/* Event Sequence Panel - Full sequence view for completed events */}
        <EventSequencePanel
          event={event}
          sequences={FULL_SEQUENCE}
          isMasterView={true}
        />
      </main>

      {/* Options Drawer/Modal */}
      <OptionsDrawer
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        eventCode={event.eventCode}
        eventLink={`${window.location.origin}/event/${compositeId}/results`}
        eventId={event.id}
        onNavigateToAdmin={() => {
          navigate(`/event/${compositeId}`);
        }}
        isMobile={typeof window !== 'undefined' && window.innerWidth < 640}
      />
    </div>
  );
};
