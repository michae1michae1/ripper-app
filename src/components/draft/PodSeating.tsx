import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import type { Player } from '@/types/event';

interface PodSeatingProps {
  players: Player[];
  passDirection: 'left' | 'right';
}

export const PodSeating = ({ players, passDirection }: PodSeatingProps) => {
  const totalPlayers = players.length;
  const topRow = players.slice(0, Math.ceil(totalPlayers / 2));
  const bottomRow = players.slice(Math.ceil(totalPlayers / 2)).reverse();
  
  return (
    <div className="bg-obsidian border border-storm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate rounded grid grid-cols-2 gap-0.5 p-0.5">
            <div className="bg-mist rounded-sm" />
            <div className="bg-mist rounded-sm" />
            <div className="bg-mist rounded-sm" />
            <div className="bg-mist rounded-sm" />
          </div>
          <span className="font-semibold text-snow">Pod Seating</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
          <span className="text-sm text-mist">{totalPlayers} Active Players</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Top Row */}
        <div className="flex justify-center gap-3">
          {topRow.map((player, i) => (
            <PlayerSeat
              key={player.id}
              player={player}
              seatNumber={i + 1}
              showArrow={i < topRow.length - 1}
              arrowDirection={passDirection === 'left' ? 'right' : 'left'}
            />
          ))}
        </div>
        
        {/* Direction indicators on sides */}
        <div className="flex justify-between px-4">
          <div className="flex items-center text-arcane">
            {passDirection === 'left' ? (
              <ArrowUp className="w-5 h-5" />
            ) : (
              <ArrowDown className="w-5 h-5" />
            )}
          </div>
          <div className="flex items-center text-arcane">
            {passDirection === 'left' ? (
              <ArrowDown className="w-5 h-5" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </div>
        </div>
        
        {/* Bottom Row */}
        <div className="flex justify-center gap-3">
          {bottomRow.map((player, i) => {
            const actualSeat = totalPlayers - i;
            return (
              <PlayerSeat
                key={player.id}
                player={player}
                seatNumber={actualSeat}
                showArrow={i < bottomRow.length - 1}
                arrowDirection={passDirection === 'left' ? 'left' : 'right'}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface PlayerSeatProps {
  player: Player;
  seatNumber: number;
  showArrow: boolean;
  arrowDirection: 'left' | 'right';
}

const PlayerSeat = ({ player, seatNumber, showArrow, arrowDirection }: PlayerSeatProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-slate border border-storm rounded-xl p-3 min-w-[140px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-mist font-mono">SEAT {String(seatNumber).padStart(2, '0')}</span>
          <Badge variant="success" className="text-[10px]">PICKING</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Avatar name={player.name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-snow truncate">{player.name}</p>
          </div>
        </div>
      </div>
      {showArrow && (
        <div className="text-arcane">
          {arrowDirection === 'right' ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <ArrowLeft className="w-4 h-4" />
          )}
        </div>
      )}
    </div>
  );
};

