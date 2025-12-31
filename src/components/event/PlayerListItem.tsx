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
    <div className="flex items-center gap-3 py-2 px-1 group">
      <span className="text-xs text-mist w-6 text-right font-mono">
        {String(index + 1).padStart(2, '0')}
      </span>
      <Avatar name={player.name} size="md" />
      <div className="flex-1 min-w-0">
        <span className="text-snow font-medium truncate block">{player.name}</span>
      </div>
      {player.isHost && (
        <Badge variant="arcane">HOST</Badge>
      )}
      {canRemove && !player.isHost && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-mist hover:text-danger"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

