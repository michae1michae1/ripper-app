import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Trophy, Sun } from 'lucide-react';
import { Button, Badge, Avatar } from '@/components/ui';
import { useEventStore } from '@/lib/store';
import { calculateStandings } from '@/lib/swiss';
import { getEventSession } from '@/lib/api';
import { MANA_COLORS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { ManaColor } from '@/types/event';

export const FinalScoreboardPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [copied, setCopied] = useState(false);
  
  const {
    event,
    loadEvent,
    setPlayerDeckColors,
    setLoading,
    setError,
    isLoading,
  } = useEventStore();

  useEffect(() => {
    if (eventId && !event) {
      setLoading(true);
      getEventSession(eventId).then(({ data, error }) => {
        if (data) {
          loadEvent(data);
        } else {
          setError(error || 'Event not found');
          navigate('/');
        }
      });
    }
  }, [eventId, event, loadEvent, setLoading, setError, navigate]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!event) return;
    
    const standings = calculateStandings(event.players, event.rounds);
    
    // Generate CSV
    const headers = ['Rank', 'Player', 'Points', 'Record', 'OMW%', 'GW%'];
    const rows = standings.map((s, i) => {
      const player = event.players.find(p => p.id === s.playerId);
      return [
        i + 1,
        player?.name || 'Unknown',
        s.points,
        `${s.wins}-${s.losses}-${s.draws}`,
        `${s.opponentMatchWinPercentage.toFixed(1)}%`,
        `${s.gameWinPercentage.toFixed(1)}%`,
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/\s+/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleDeckColor = (playerId: string, color: ManaColor) => {
    const player = event?.players.find(p => p.id === playerId);
    if (!player) return;
    
    const currentColors = player.deckColors || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    
    setPlayerDeckColors(playerId, newColors);
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  const standings = calculateStandings(event.players, event.rounds);
  const completedDate = new Date(event.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const lastRound = event.settings.totalRounds;

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/event/${event.id}/round/${lastRound}`)}
            className="flex items-center gap-2 text-mist hover:text-snow transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Round {lastRound} Matches</span>
          </button>
          
          <span className="text-sm text-mist uppercase tracking-wider font-semibold">
            Final Scoreboard
          </span>
          
          <Button variant="ghost" size="icon">
            <Sun className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Event Info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="success">COMPLETED</Badge>
            <span className="text-sm text-mist">{completedDate}</span>
          </div>
          <h1 className="text-4xl font-bold">
            <span className="text-snow">{event.name}: </span>
            <span className="text-arcane italic">
              {event.type === 'draft' ? 'Booster Draft' : 'Sealed Deck'}
            </span>
          </h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-mist">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 bg-slate rounded flex items-center justify-center text-xs">📦</span>
              {event.type === 'draft' ? 'Booster Draft' : 'Sealed Deck'}
            </span>
            <span>👥 {event.players.length} Players</span>
            <span>🏆 {event.settings.totalRounds} Rounds</span>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <Button variant="secondary" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied!' : 'Share'}
            </Button>
            <Button variant="primary" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Standings Table */}
        <div className="bg-obsidian border border-storm rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_140px_120px_100px_60px] gap-4 px-4 py-3 bg-slate/50 text-xs text-mist uppercase tracking-wide">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-center">Colors</span>
            <span className="text-center">Record</span>
            <span className="text-right">Stats</span>
            <span className="text-right">Pts</span>
          </div>
          
          {/* Rows */}
          <div className="divide-y divide-storm">
            {standings.map((standing, index) => {
              const player = event.players.find(p => p.id === standing.playerId);
              if (!player) return null;
              
              const rank = index + 1;
              const isWinner = rank === 1;
              const isTop3 = rank <= 3;
              
              return (
                <div
                  key={standing.playerId}
                  className={cn(
                    'grid grid-cols-[60px_1fr_140px_120px_100px_60px] gap-4 px-4 py-4 items-center',
                    isWinner && 'bg-gradient-to-r from-yellow-500/10 to-transparent border-l-2 border-yellow-500',
                    isTop3 && !isWinner && 'bg-arcane/5'
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    {isWinner ? (
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <span className={cn(
                        'text-lg font-bold',
                        isTop3 ? 'text-snow' : 'text-mist'
                      )}>
                        {rank}
                      </span>
                    )}
                  </div>
                  
                  {/* Player */}
                  <div className="flex items-center gap-3">
                    <Avatar name={player.name} size="md" />
                    <div>
                      <p className="font-semibold text-snow">{player.name}</p>
                      {player.deckColors && player.deckColors.length > 0 && (
                        <p className="text-xs text-mist">
                          {player.deckColors.map(c => MANA_COLORS[c].name).join(' ')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Deck Colors */}
                  <div className="flex items-center justify-center gap-1">
                    {(['W', 'U', 'B', 'R', 'G'] as ManaColor[]).map((color) => (
                      <button
                        key={color}
                        onClick={() => toggleDeckColor(player.id, color)}
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                          MANA_COLORS[color].bg,
                          MANA_COLORS[color].text,
                          player.deckColors?.includes(color)
                            ? 'opacity-100 ring-2 ring-arcane ring-offset-2 ring-offset-midnight'
                            : 'opacity-30 hover:opacity-60'
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  
                  {/* Record */}
                  <div className="flex justify-center">
                    <Badge variant="muted" className="font-mono">
                      {standing.wins}-{standing.losses}-{standing.draws}
                    </Badge>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-sm text-snow">
                      {standing.opponentMatchWinPercentage.toFixed(1)}%
                      <span className="text-xs text-mist ml-1">OMW</span>
                    </p>
                    <p className="text-xs text-mist">
                      {standing.gameWinPercentage.toFixed(1)}% GW
                    </p>
                  </div>
                  
                  {/* Points */}
                  <div className="text-right">
                    <span className={cn(
                      'text-2xl font-bold',
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

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between text-xs text-mist">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {(['W', 'U', 'B', 'R', 'G'] as ManaColor[]).map((color) => (
                <div
                  key={color}
                  className={cn(
                    'w-4 h-4 rounded-full',
                    MANA_COLORS[color].bg
                  )}
                />
              ))}
              <span>Deck Colors</span>
            </div>
            <span><strong>OMW%</strong> Opponent Match Win %</span>
          </div>
          <span>Official DCI Scoring</span>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-mist">
          <p>© {new Date().getFullYear()} Ripper Limit. Built for the community.</p>
        </div>
      </main>
    </div>
  );
};

