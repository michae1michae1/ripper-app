import { Minus, Plus } from 'lucide-react';
import { Button, Badge, EditablePlayerName } from '@/components/ui';
import type { Match, MatchResult, Player, PlayerStanding } from '@/types/event';
import { cn } from '@/lib/cn';

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
  
  const handleScoreChange = (player: 'A' | 'B', delta: number) => {
    const newA = player === 'A' ? Math.max(0, Math.min(3, currentA + delta)) : currentA;
    const newB = player === 'B' ? Math.max(0, Math.min(3, currentB + delta)) : currentB;
    
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
  const playerAWins = result && !result.isDraw && result.playerAWins > result.playerBWins;
  const playerBWins = result && !result.isDraw && result.playerBWins > result.playerAWins;

  return (
    <div 
      data-component="MatchCard"
      data-match-id={match.id}
      data-table={tableNumber}
      data-is-bye={isBye || undefined}
      data-player-a-wins={playerAWins || undefined}
      data-player-b-wins={playerBWins || undefined}
      data-is-draw={result?.isDraw || undefined}
      className="match-card bg-obsidian border border-storm p-4"
    >
      <div className="match-card__content flex items-center justify-between">
        {/* Table Number */}
        <div className="match-card__table w-8 text-center">
          <span className="match-card__table-number text-sm text-mist">{tableNumber}</span>
        </div>

        {/* Player A */}
        <div className={cn(
          'match-card__player-a flex-1 text-left pl-4',
          playerAWins && 'match-card__player-a--winner text-success'
        )}>
          <EditablePlayerName
            playerId={playerA.id}
            name={playerA.name}
            className={cn(
              'match-card__player-name font-medium',
              playerAWins ? 'text-success' : 'text-snow'
            )}
            size="md"
          />
          <p className="match-card__player-record text-xs text-mist">
            {getPlayerRecord(playerA.id, standings)}
          </p>
        </div>

        {/* Score Controls */}
        <div className="match-card__score-controls flex items-center gap-3">
          {/* Player A Score */}
          <div className="match-card__score-group match-card__score-group--a flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange('A', -1)}
              disabled={isBye || currentA === 0}
              className="match-card__score-decrease w-7 h-7"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div className={cn(
              'match-card__score-display',
              'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
              playerAWins ? 'match-card__score-display--winner bg-success/20 text-success' : 'bg-slate text-snow'
            )}>
              {currentA}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange('A', 1)}
              disabled={isBye || currentA === 3 || totalGames >= 3}
              className="match-card__score-increase w-7 h-7"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Draw Button */}
          <Button
            variant={result?.isDraw ? 'primary' : 'ghost'}
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
              onClick={() => handleScoreChange('B', -1)}
              disabled={isBye || currentB === 0}
              className="match-card__score-decrease w-7 h-7"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div className={cn(
              'match-card__score-display',
              'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
              playerBWins ? 'match-card__score-display--winner bg-success/20 text-success' : 'bg-slate text-snow'
            )}>
              {isBye ? '-' : currentB}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange('B', 1)}
              disabled={isBye || currentB === 3 || totalGames >= 3}
              className="match-card__score-increase w-7 h-7"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Player B */}
        <div className={cn(
          'match-card__player-b flex-1 text-right pr-4',
          playerBWins && 'match-card__player-b--winner text-success'
        )}>
          {isBye ? (
            <div className="match-card__bye">
              <Badge variant="success" className="match-card__bye-badge mb-1">Auto Win (Bye)</Badge>
              <p className="match-card__bye-text text-sm text-mist">NO OPPONENT</p>
            </div>
          ) : (
            <div className="match-card__player-info flex flex-col items-end">
              <EditablePlayerName
                playerId={playerB.id}
                name={playerB.name}
                className={cn(
                  'match-card__player-name font-medium',
                  playerBWins ? 'text-success' : 'text-snow'
                )}
                size="md"
              />
              <p className="match-card__player-record text-xs text-mist">
                {getPlayerRecord(playerB.id, standings)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getPlayerRecord(playerId: string, standings: PlayerStanding[]): string {
  const standing = standings.find(s => s.playerId === playerId);
  if (!standing) {
    return '0 pts (0-0-0)';
  }
  return `${standing.points} pts (${standing.wins}-${standing.losses}-${standing.draws})`;
}

