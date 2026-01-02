import { Minus, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Button, Badge, EditablePlayerName } from "@/components/ui";
import type { Match, MatchResult, Player, PlayerStanding } from "@/types/event";
import { cn } from "@/lib/cn";

interface MatchCardProps {
  match: Match;
  tableNumber: number;
  playerA: Player;
  playerB: Player | null;
  onUpdateResult: (result: MatchResult) => void;
  standings?: PlayerStanding[];
}

export const MatchCard = ({
  match,
  tableNumber,
  playerA,
  playerB,
  onUpdateResult,
  standings = [],
}: MatchCardProps) => {
  const result = match.result;
  const isBye = playerB === null;

  const currentA = result?.playerAWins ?? 0;
  const currentB = result?.playerBWins ?? 0;
  const totalGames = currentA + currentB;

  const handleScoreChange = (player: "A" | "B", delta: number) => {
    const newA =
      player === "A" ? Math.max(0, Math.min(3, currentA + delta)) : currentA;
    const newB =
      player === "B" ? Math.max(0, Math.min(3, currentB + delta)) : currentB;

    // Don't allow total games to exceed 3
    if (newA + newB > 3) return;

    const newResult: MatchResult = {
      playerAWins: newA,
      playerBWins: newB,
      isDraw: false,
    };

    onUpdateResult(newResult);
  };

  const handleDraw = () => {
    if (result?.isDraw) {
      // Deselect draw - clear result
      onUpdateResult({ playerAWins: 0, playerBWins: 0, isDraw: false });
    } else {
      // Select draw - set 1-1
      onUpdateResult({ playerAWins: 1, playerBWins: 1, isDraw: true });
    }
  };

  // Determine winner highlighting
  const playerAWins =
    result && !result.isDraw && result.playerAWins > result.playerBWins;
  const playerBWins =
    result && !result.isDraw && result.playerBWins > result.playerAWins;

  return (
    <div
      data-component="MatchCard"
      data-match-id={match.id}
      data-table={tableNumber}
      data-is-bye={isBye || undefined}
      data-player-a-wins={playerAWins || undefined}
      data-player-b-wins={playerBWins || undefined}
      data-is-draw={result?.isDraw || undefined}
      className="match-card bg-obsidian border border-storm p-3 sm:p-4"
    >
      <div className="match-card__content flex items-center justify-between gap-2 sm:gap-4">
        {/* Table Number - Hidden on mobile */}
        <div className="match-card__table hidden sm:block w-8 text-center">
          <span className="match-card__table-number text-sm text-mist">
            {tableNumber}
          </span>
        </div>

        {/* Player A */}
        <div
          className={cn(
            "match-card__player-a flex-1 min-w-0 text-left sm:pl-4",
            playerAWins && "match-card__player-a--winner text-success"
          )}
        >
          <EditablePlayerName
            playerId={playerA.id}
            name={playerA.name}
            className={cn(
              "match-card__player-name font-medium truncate text-sm sm:text-base",
              playerAWins ? "text-success" : "text-snow"
            )}
            size="md"
          />
          <p className="match-card__player-record text-xs text-mist truncate">
            {getPlayerRecordShort(playerA.id, standings)}
          </p>
        </div>

        {/* Score Controls - Desktop Layout */}
        <div className="match-card__score-controls hidden sm:flex items-center gap-3">
          {/* Player A Score */}
          <div className="match-card__score-group match-card__score-group--a flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange("A", -1)}
              disabled={isBye || currentA === 0}
              className="match-card__score-decrease w-7 h-7"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div
              className={cn(
                "match-card__score-display",
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold",
                playerAWins
                  ? "match-card__score-display--winner bg-success/20 text-success"
                  : "bg-slate text-snow"
              )}
            >
              {currentA}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange("A", 1)}
              disabled={isBye || currentA === 3 || totalGames >= 3}
              className="match-card__score-increase w-7 h-7"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Draw Button */}
          <Button
            variant={result?.isDraw ? "primary" : "ghost"}
            size="sm"
            onClick={handleDraw}
            disabled={isBye}
            className="match-card__draw-btn text-xs"
          >
            DRAW
          </Button>

          {/* Player B Score */}
          <div className="match-card__score-group match-card__score-group--b flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange("B", -1)}
              disabled={isBye || currentB === 0}
              className="match-card__score-decrease w-7 h-7"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div
              className={cn(
                "match-card__score-display",
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold",
                playerBWins
                  ? "match-card__score-display--winner bg-success/20 text-success"
                  : "bg-slate text-snow"
              )}
            >
              {isBye ? "-" : currentB}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange("B", 1)}
              disabled={isBye || currentB === 3 || totalGames >= 3}
              className="match-card__score-increase w-7 h-7"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Score Controls - Mobile Layout with thin arrows */}
        <div className="match-card__score-controls-mobile flex sm:hidden items-center gap-2">
          {/* Player A Score - Vertical */}
          <div className="match-card__score-group-mobile flex flex-col items-center">
            <button
              onClick={() => handleScoreChange("A", 1)}
              disabled={isBye || currentA === 3 || totalGames >= 3}
              className={cn(
                "match-card__score-up w-8 h-4 flex items-center justify-center text-mist hover:text-snow transition-colors",
                (isBye || currentA === 3 || totalGames >= 3) &&
                  "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div
              className={cn(
                "match-card__score-display-mobile",
                "w-8 h-8 rounded flex items-center justify-center text-base font-bold",
                playerAWins
                  ? "bg-success/20 text-success"
                  : "bg-slate text-snow"
              )}
            >
              {currentA}
            </div>
            <button
              onClick={() => handleScoreChange("A", -1)}
              disabled={isBye || currentA === 0}
              className={cn(
                "match-card__score-down w-8 h-4 flex items-center justify-center text-mist hover:text-snow transition-colors",
                (isBye || currentA === 0) && "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Draw Button - Mobile */}
          <button
            onClick={handleDraw}
            disabled={isBye}
            className={cn(
              "match-card__draw-btn-mobile w-6 h-8 rounded text-xs font-bold transition-colors",
              result?.isDraw
                ? "bg-arcane text-white"
                : "bg-slate text-mist hover:text-snow",
              isBye && "opacity-30 cursor-not-allowed"
            )}
          >
            D
          </button>

          {/* Player B Score - Vertical */}
          <div className="match-card__score-group-mobile flex flex-col items-center">
            <button
              onClick={() => handleScoreChange("B", 1)}
              disabled={isBye || currentB === 3 || totalGames >= 3}
              className={cn(
                "match-card__score-up w-8 h-4 flex items-center justify-center text-mist hover:text-snow transition-colors",
                (isBye || currentB === 3 || totalGames >= 3) &&
                  "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div
              className={cn(
                "match-card__score-display-mobile",
                "w-8 h-8 rounded flex items-center justify-center text-base font-bold",
                playerBWins
                  ? "bg-success/20 text-success"
                  : "bg-slate text-snow"
              )}
            >
              {isBye ? "-" : currentB}
            </div>
            <button
              onClick={() => handleScoreChange("B", -1)}
              disabled={isBye || currentB === 0}
              className={cn(
                "match-card__score-down w-8 h-4 flex items-center justify-center text-mist hover:text-snow transition-colors",
                (isBye || currentB === 0) && "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Player B */}
        <div
          className={cn(
            "match-card__player-b flex-1 min-w-0 text-right sm:pr-4",
            playerBWins && "match-card__player-b--winner text-success"
          )}
        >
          {isBye ? (
            <div className="match-card__bye">
              <Badge
                variant="success"
                className="match-card__bye-badge mb-1 text-xs"
              >
                <span className="hidden sm:inline">Auto Win (Bye)</span>
                <span className="sm:hidden">Bye</span>
              </Badge>
              <p className="match-card__bye-text text-xs sm:text-sm text-mist">
                <span className="hidden sm:inline">NO OPPONENT</span>
                <span className="sm:hidden">—</span>
              </p>
            </div>
          ) : (
            <div className="match-card__player-info flex flex-col items-end">
              <EditablePlayerName
                playerId={playerB.id}
                name={playerB.name}
                className={cn(
                  "match-card__player-name font-medium truncate text-sm sm:text-base text-right",
                  playerBWins ? "text-success" : "text-snow"
                )}
                size="md"
              />
              <p className="match-card__player-record text-xs text-mist truncate text-right">
                {getPlayerRecordShort(playerB.id, standings)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Shorter version for mobile - just shows W-L-D record
function getPlayerRecordShort(
  playerId: string,
  standings: PlayerStanding[]
): string {
  const standing = standings.find((s) => s.playerId === playerId);
  if (!standing) {
    return "0-0-0";
  }
  return `${standing.wins}-${standing.losses}-${standing.draws}`;
}
