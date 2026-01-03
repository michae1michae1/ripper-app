import { Trophy, Medal } from 'lucide-react';
import { Badge, Avatar } from '@/components/ui';
import { calculateStandings } from '@/lib/swiss';
import { cn } from '@/lib/cn';
import type { EventSession, Player } from '@/types/event';

interface PlayerResultsViewProps {
  event: EventSession;
  player: Player;
}

export const PlayerResultsView = ({ event, player }: PlayerResultsViewProps) => {
  const standings = calculateStandings(event.players, event.rounds);
  
  // Find player's rank
  const playerRank = standings.findIndex(s => s.playerId === player.id) + 1;
  const playerStanding = standings.find(s => s.playerId === player.id);

  // Completion date
  const completedDate = new Date(event.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div 
      data-component="PlayerResultsView"
      className="player-results-view flex flex-col items-center px-4 pt-8 pb-12"
    >
      {/* Event Complete Header */}
      <div className="player-results-view__header text-center mb-8">
        <div className="player-results-view__badge flex items-center justify-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full mb-4">
          <Trophy className="w-5 h-5" />
          <span className="font-semibold">Event Complete</span>
        </div>
        <h2 className="player-results-view__title text-2xl sm:text-3xl font-bold text-snow mb-2">
          {event.name}
        </h2>
        {event.setName && (
          <p className="player-results-view__set text-arcane italic">
            {event.setName}
          </p>
        )}
        <p className="player-results-view__date text-sm text-mist mt-2">
          {completedDate}
        </p>
      </div>

      {/* Player's Result Card */}
      <div className={cn(
        'player-results-view__my-result',
        'bg-obsidian border-2 rounded-xl p-6 max-w-sm w-full mb-8',
        playerRank === 1 ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-transparent' :
        playerRank <= 3 ? 'border-arcane' : 'border-storm'
      )}>
        <div className="player-results-view__my-result-header flex items-center justify-between mb-4">
          <span className="player-results-view__your-finish text-sm uppercase tracking-wide text-mist">
            Your Finish
          </span>
          {playerRank === 1 && (
            <Trophy className="w-6 h-6 text-yellow-500" />
          )}
          {playerRank === 2 && (
            <Medal className="w-6 h-6 text-silver" />
          )}
          {playerRank === 3 && (
            <Medal className="w-6 h-6 text-amber-700" />
          )}
        </div>
        
        <div className="player-results-view__my-result-main flex items-center gap-4">
          <div className={cn(
            'player-results-view__rank-circle',
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
            playerRank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
            playerRank <= 3 ? 'bg-arcane/20 text-arcane' : 'bg-slate text-snow'
          )}>
            #{playerRank}
          </div>
          <div className="player-results-view__my-result-info flex-1">
            <p className="player-results-view__my-name text-xl font-semibold text-snow">
              {player.name}
            </p>
            {playerStanding && (
              <div className="player-results-view__my-stats flex items-center gap-2 mt-1">
                <Badge variant="muted" className="font-mono text-sm">
                  {playerStanding.wins}-{playerStanding.losses}-{playerStanding.draws}
                </Badge>
                <span className="text-sm text-mist">
                  {playerStanding.points} pts
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Celebration message for winners */}
        {playerRank === 1 && (
          <p className="player-results-view__winner-message text-center text-yellow-500 mt-4 font-medium">
            🎉 Congratulations! You won!
          </p>
        )}
      </div>

      {/* Full Standings */}
      <div className="player-results-view__standings bg-obsidian border border-storm rounded-xl overflow-hidden max-w-md w-full">
        <div className="player-results-view__standings-header px-4 py-3 bg-slate/50 text-xs text-mist uppercase tracking-wide">
          <div className="grid grid-cols-[40px_1fr_60px_40px] gap-2">
            <span>#</span>
            <span>Player</span>
            <span className="text-center">Record</span>
            <span className="text-right">Pts</span>
          </div>
        </div>
        
        <div className="player-results-view__standings-list divide-y divide-storm max-h-80 overflow-y-auto">
          {standings.map((standing, index) => {
            const standingPlayer = event.players.find(p => p.id === standing.playerId);
            if (!standingPlayer) return null;
            
            const rank = index + 1;
            const isMe = standing.playerId === player.id;
            const isWinner = rank === 1;

            return (
              <div
                key={standing.playerId}
                data-rank={rank}
                data-is-me={isMe || undefined}
                className={cn(
                  'player-results-view__standings-row',
                  'grid grid-cols-[40px_1fr_60px_40px] gap-2 px-4 py-3 items-center',
                  isMe && 'bg-arcane/10 border-l-2 border-arcane',
                  isWinner && !isMe && 'bg-yellow-500/5'
                )}
              >
                {/* Rank */}
                <div className="player-results-view__standing-rank">
                  {isWinner ? (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <span className={cn(
                      'text-sm font-semibold',
                      rank <= 3 ? 'text-snow' : 'text-mist'
                    )}>
                      {rank}
                    </span>
                  )}
                </div>

                {/* Player */}
                <div className="player-results-view__standing-player flex items-center gap-2 min-w-0">
                  <Avatar name={standingPlayer.name} size="sm" />
                  <span className={cn(
                    'truncate text-sm',
                    isMe ? 'text-arcane font-semibold' : 'text-snow'
                  )}>
                    {standingPlayer.name}
                    {isMe && <span className="text-xs ml-1">(You)</span>}
                  </span>
                </div>

                {/* Record */}
                <div className="player-results-view__standing-record text-center">
                  <span className="text-xs font-mono text-silver">
                    {standing.wins}-{standing.losses}-{standing.draws}
                  </span>
                </div>

                {/* Points */}
                <div className="player-results-view__standing-points text-right">
                  <span className={cn(
                    'text-sm font-bold',
                    standing.points > 0 ? 'text-arcane' : 'text-mist'
                  )}>
                    {standing.points}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <p className="player-results-view__footer text-xs text-mist mt-6">
        Thanks for playing! 🃏
      </p>
    </div>
  );
};

