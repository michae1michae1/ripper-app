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
    <div 
      data-component="StandingsModal"
      className="standings-modal fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div 
        className="standings-modal__backdrop absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="standings-modal__content relative bg-obsidian border border-storm rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="standings-modal__header flex items-center justify-between p-4 border-b border-storm">
          <h2 className="standings-modal__title text-lg font-semibold text-snow">Current Standings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="standings-modal__close-btn">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Table */}
        <div className="standings-modal__table-wrapper overflow-auto max-h-[60vh]">
          <table className="standings-modal__table w-full">
            <thead className="standings-modal__table-header bg-slate/50 sticky top-0">
              <tr className="text-xs text-mist uppercase tracking-wide">
                <th className="standings-modal__th standings-modal__th--rank py-3 px-4 text-left">Rank</th>
                <th className="standings-modal__th standings-modal__th--player py-3 px-4 text-left">Player</th>
                <th className="standings-modal__th standings-modal__th--record py-3 px-4 text-center">Record</th>
                <th className="standings-modal__th standings-modal__th--omw py-3 px-4 text-right">OMW%</th>
                <th className="standings-modal__th standings-modal__th--points py-3 px-4 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="standings-modal__table-body divide-y divide-storm">
              {standings.map((standing, index) => {
                const player = getPlayer(standing.playerId);
                if (!player) return null;
                
                const rank = index + 1;
                const isTop3 = rank <= 3;
                
                return (
                  <tr 
                    key={standing.playerId}
                    data-rank={rank}
                    data-player-id={player.id}
                    data-top3={isTop3 || undefined}
                    className={cn(
                      'standings-modal__row',
                      isTop3 && 'standings-modal__row--top3',
                      'transition-colors hover:bg-slate/30',
                      isTop3 && 'bg-arcane/5'
                    )}
                  >
                    <td className="standings-modal__td standings-modal__td--rank py-3 px-4">
                      <div className="standings-modal__rank-content flex items-center gap-2">
                        {rank === 1 ? (
                          <Trophy className="standings-modal__trophy w-5 h-5 text-yellow-500" />
                        ) : (
                          <span className={cn(
                            'standings-modal__rank-number text-sm font-medium',
                            isTop3 ? 'text-snow' : 'text-mist'
                          )}>
                            {rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="standings-modal__td standings-modal__td--player py-3 px-4">
                      <div className="standings-modal__player-info flex items-center gap-3">
                        <div className="hidden sm:block">
                          <Avatar name={player.name} size="sm" />
                        </div>
                        <EditablePlayerName
                          playerId={player.id}
                          name={player.name}
                          className="font-medium text-snow"
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="standings-modal__td standings-modal__td--record py-3 px-4 text-center">
                      <Badge variant="muted" className="standings-modal__record-badge">
                        {standing.wins}-{standing.losses}-{standing.draws}
                      </Badge>
                    </td>
                    <td className="standings-modal__td standings-modal__td--omw py-3 px-4 text-right text-sm text-mist">
                      {standing.opponentMatchWinPercentage.toFixed(1)}%
                    </td>
                    <td className="standings-modal__td standings-modal__td--points py-3 px-4 text-right">
                      <span className={cn(
                        'standings-modal__points text-lg font-bold',
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

