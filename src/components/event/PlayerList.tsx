import { Shuffle, Info } from 'lucide-react';
import { Button } from '@/components/ui';
import { PlayerListItem } from './PlayerListItem';
import { PlayerInput } from './PlayerInput';
import type { Player } from '@/types/event';
import { OPTIMAL_DRAFT_PLAYERS, MAX_PLAYERS } from '@/lib/constants';

interface PlayerListProps {
  players: Player[];
  eventType: 'draft' | 'sealed';
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onRandomize: () => void;
}

export const PlayerList = ({
  players,
  eventType,
  onAddPlayer,
  onRemovePlayer,
  onRandomize,
}: PlayerListProps) => {
  const playerCount = players.length;
  const isAtMax = playerCount >= MAX_PLAYERS;
  const needsMore = eventType === 'draft' && playerCount < OPTIMAL_DRAFT_PLAYERS;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-snow uppercase tracking-wide">Players</h3>
          <span className="text-sm text-mist">
            {playerCount} / {eventType === 'draft' ? OPTIMAL_DRAFT_PLAYERS : MAX_PLAYERS}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRandomize}
          disabled={playerCount < 2}
          className="gap-1.5"
        >
          <Shuffle className="w-4 h-4" />
          Randomize
        </Button>
      </div>
      
      <PlayerInput onAddPlayer={onAddPlayer} disabled={isAtMax} />
      
      <div className="border border-storm rounded-lg divide-y divide-storm">
        {players.map((player, index) => (
          <PlayerListItem
            key={player.id}
            player={player}
            index={index}
            onRemove={() => onRemovePlayer(player.id)}
            canRemove={playerCount > 1}
          />
        ))}
      </div>
      
      {needsMore && (
        <div className="flex items-start gap-2 bg-slate/50 rounded-lg p-3">
          <Info className="w-4 h-4 text-mist mt-0.5 flex-shrink-0" />
          <p className="text-sm text-mist">
            Drafts are optimized for {OPTIMAL_DRAFT_PLAYERS} players. You need{' '}
            <span className="text-snow font-medium">
              {OPTIMAL_DRAFT_PLAYERS - playerCount} more
            </span>.
          </p>
        </div>
      )}
    </div>
  );
};

