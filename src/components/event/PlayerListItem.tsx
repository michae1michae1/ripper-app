import { X } from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui';
import type { Player } from '@/types/event';

interface PlayerListItemProps {
  player: Player;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export const PlayerListItem = ({ player, index, onRemove, canRemove }: PlayerListItemProps) => {
  return (
    <div 
      data-component="PlayerListItem"
      data-player-id={player.id}
      data-is-host={player.isHost || undefined}
      data-seat={index + 1}
      className="player-list-item flex items-center gap-3 py-2 px-1 group"
    >
      <span className="player-list-item__seat text-xs text-mist w-6 text-right font-mono">
        {String(index + 1).padStart(2, '0')}
      </span>
      <Avatar name={player.name} size="md" />
      <div className="player-list-item__info flex-1 min-w-0">
        <span className="player-list-item__name text-snow font-medium truncate block">{player.name}</span>
      </div>
      {player.isHost && (
        <Badge variant="arcane" className="player-list-item__host-badge">HOST</Badge>
      )}
      {canRemove && !player.isHost && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="player-list-item__remove-btn opacity-0 group-hover:opacity-100 text-mist hover:text-danger"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

