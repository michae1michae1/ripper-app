import { X, Trophy } from 'lucide-react';
import { Button, Avatar, Badge, EditablePlayerName } from '@/components/ui';
import type { PlayerStanding, Player } from '@/types/event';
import { cn } from '@/lib/cn';

interface StandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  standings: PlayerStanding[];
  players: Player[];
}

export const StandingsModal = ({
  isOpen,
  onClose,
  standings,
  players,
}: StandingsModalProps) => {
  if (!isOpen) return null;

  const getPlayer = (playerId: string) => 
    players.find(p => p.id === playerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-obsidian border border-storm rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-storm">
          <h2 className="text-lg font-semibold text-snow">Current Standings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Table */}
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="bg-slate/50 sticky top-0">
              <tr className="text-xs text-mist uppercase tracking-wide">
                <th className="py-3 px-4 text-left">Rank</th>
                <th className="py-3 px-4 text-left">Player</th>
                <th className="py-3 px-4 text-center">Record</th>
                <th className="py-3 px-4 text-right">OMW%</th>
                <th className="py-3 px-4 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-storm">
              {standings.map((standing, index) => {
                const player = getPlayer(standing.playerId);
                if (!player) return null;
                
                const rank = index + 1;
                const isTop3 = rank <= 3;
                
                return (
                  <tr 
                    key={standing.playerId}
                    className={cn(
                      'transition-colors hover:bg-slate/30',
                      isTop3 && 'bg-arcane/5'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {rank === 1 ? (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <span className={cn(
                            'text-sm font-medium',
                            isTop3 ? 'text-snow' : 'text-mist'
                          )}>
                            {rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={player.name} size="sm" />
                        <EditablePlayerName
                          playerId={player.id}
                          name={player.name}
                          className="font-medium text-snow"
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="muted">
                        {standing.wins}-{standing.losses}-{standing.draws}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-mist">
                      {standing.opponentMatchWinPercentage.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        'text-lg font-bold',
                        standing.points > 0 ? 'text-snow' : 'text-mist'
                      )}>
                        {standing.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

