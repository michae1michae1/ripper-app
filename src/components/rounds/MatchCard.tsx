import { Minus, Plus } from 'lucide-react';
import { Button, Badge, EditablePlayerName } from '@/components/ui';
import type { Match, MatchResult, Player } from '@/types/event';
import { cn } from '@/lib/cn';

interface MatchCardProps {
  match: Match;
  tableNumber: number;
  playerA: Player;
  playerB: Player | null;
  onUpdateResult: (result: MatchResult) => void;
}

export const MatchCard = ({
  match,
  tableNumber,
  playerA,
  playerB,
  onUpdateResult,
}: MatchCardProps) => {
  const result = match.result;
  const isBye = playerB === null;
  
  const handleScoreChange = (player: 'A' | 'B', delta: number) => {
    const currentA = result?.playerAWins ?? 0;
    const currentB = result?.playerBWins ?? 0;
    
    const newResult: MatchResult = {
      playerAWins: player === 'A' ? Math.max(0, Math.min(2, currentA + delta)) : currentA,
      playerBWins: player === 'B' ? Math.max(0, Math.min(2, currentB + delta)) : currentB,
      isDraw: false,
    };
    
    onUpdateResult(newResult);
  };

  const handleDraw = () => {
    onUpdateResult({
      playerAWins: 0,
      playerBWins: 0,
      isDraw: true,
    });
  };

  // Determine winner highlighting
  const playerAWins = result && !result.isDraw && result.playerAWins > result.playerBWins;
  const playerBWins = result && !result.isDraw && result.playerBWins > result.playerAWins;

  return (
    <div className="bg-obsidian border border-storm p-4">
      <div className="flex items-center justify-between">
        {/* Table Number */}
        <div className="w-8 text-center">
          <span className="text-sm text-mist">{tableNumber}</span>
        </div>

        {/* Player A */}
        <div className={cn(
          'flex-1 text-left pl-4',
          playerAWins && 'text-success'
        )}>
          <EditablePlayerName
            playerId={playerA.id}
            name={playerA.name}
            className={cn(
              'font-medium',
              playerAWins ? 'text-success' : 'text-snow'
            )}
            size="md"
          />
          <p className="text-xs text-mist">
            {getPlayerRecord(playerA)}
          </p>
        </div>

        {/* Score Controls */}
        <div className="flex items-center gap-3">
          {/* Player A Score */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange('A', -1)}
              disabled={isBye || (result?.playerAWins ?? 0) === 0}
              className="w-7 h-7"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
              playerAWins ? 'bg-success/20 text-success' : 'bg-slate text-snow'
            )}>
              {result?.playerAWins ?? 0}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange('A', 1)}
              disabled={isBye || (result?.playerAWins ?? 0) === 2}
              className="w-7 h-7"
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
            className="text-xs"
          >
            DRAW
          </Button>

          {/* Player B Score */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange('B', -1)}
              disabled={isBye || (result?.playerBWins ?? 0) === 0}
              className="w-7 h-7"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
              playerBWins ? 'bg-success/20 text-success' : 'bg-slate text-snow'
            )}>
              {isBye ? '-' : (result?.playerBWins ?? 0)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScoreChange('B', 1)}
              disabled={isBye || (result?.playerBWins ?? 0) === 2}
              className="w-7 h-7"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Player B */}
        <div className={cn(
          'flex-1 text-right pr-4',
          playerBWins && 'text-success'
        )}>
          {isBye ? (
            <>
              <Badge variant="success" className="mb-1">Auto Win (Bye)</Badge>
              <p className="text-sm text-mist">NO OPPONENT</p>
            </>
          ) : (
            <div className="flex flex-col items-end">
              <EditablePlayerName
                playerId={playerB.id}
                name={playerB.name}
                className={cn(
                  'font-medium',
                  playerBWins ? 'text-success' : 'text-snow'
                )}
                size="md"
              />
              <p className="text-xs text-mist">
                {getPlayerRecord(playerB)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getPlayerRecord(_player: Player): string {
  // This would ideally come from standings
  return '0 points (0-0-0)';
}

