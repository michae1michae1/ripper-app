import { useState } from 'react';
import { Minus, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { reportMatchResult } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Match, MatchResult, Player } from '@/types/event';

interface PlayerMatchCardProps {
  match: Match;
  eventId: string;
  currentPlayer: Player;
  opponent: Player | null;
  onResultReported: () => void;
}

export const PlayerMatchCard = ({
  match,
  eventId,
  currentPlayer,
  opponent,
  onResultReported,
}: PlayerMatchCardProps) => {
  // Determine which side the current player is on
  const isPlayerA = match.playerAId === currentPlayer.id;
  
  // State for score input
  const [myWins, setMyWins] = useState(0);
  const [theirWins, setTheirWins] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyReported, setAlreadyReported] = useState(match.result !== null);

  // If result already exists, show read-only view
  if (match.result || alreadyReported) {
    const result = match.result;
    if (!result) return null;
    
    const myScore = isPlayerA ? result.playerAWins : result.playerBWins;
    const theirScore = isPlayerA ? result.playerBWins : result.playerAWins;
    const didWin = myScore > theirScore;
    const isDraw = result.isDraw;

    return (
      <div 
        data-component="PlayerMatchCard"
        data-state="reported"
        className="player-match-card player-match-card--reported bg-obsidian border border-storm rounded-xl p-6"
      >
        {/* Result Header */}
        <div className="player-match-card__result-header flex items-center justify-center gap-2 mb-6">
          <Check className="player-match-card__check-icon w-5 h-5 text-success" />
          <span className="player-match-card__result-label text-success font-semibold">
            Result Recorded
          </span>
        </div>

        {/* Score Display */}
        <div className="player-match-card__score-display flex items-center justify-center gap-6">
          <div className="player-match-card__my-score text-center">
            <p className="player-match-card__my-label text-xs uppercase tracking-wide text-mist mb-1">
              You
            </p>
            <p className={cn(
              'player-match-card__my-value text-4xl font-bold',
              didWin && !isDraw ? 'text-success' : 'text-snow'
            )}>
              {myScore}
            </p>
          </div>
          
          <span className="player-match-card__score-separator text-2xl text-mist">-</span>
          
          <div className="player-match-card__their-score text-center">
            <p className="player-match-card__their-label text-xs uppercase tracking-wide text-mist mb-1">
              {opponent?.name || 'Opponent'}
            </p>
            <p className={cn(
              'player-match-card__their-value text-4xl font-bold',
              !didWin && !isDraw ? 'text-success' : 'text-snow'
            )}>
              {theirScore}
            </p>
          </div>
        </div>

        {/* Result Label */}
        <div className="player-match-card__result-badge flex justify-center mt-6">
          {isDraw ? (
            <span className="player-match-card__badge player-match-card__badge--draw px-4 py-1 bg-warning/20 text-warning rounded-full text-sm font-medium">
              Draw
            </span>
          ) : didWin ? (
            <span className="player-match-card__badge player-match-card__badge--win px-4 py-1 bg-success/20 text-success rounded-full text-sm font-medium">
              You Won
            </span>
          ) : (
            <span className="player-match-card__badge player-match-card__badge--loss px-4 py-1 bg-danger/20 text-danger rounded-full text-sm font-medium">
              You Lost
            </span>
          )}
        </div>
      </div>
    );
  }

  // Handle score adjustment - matches admin logic: max 3 per player, max 3 total games
  const adjustScore = (type: 'my' | 'their', delta: number) => {
    const newMyWins = type === 'my' ? Math.max(0, Math.min(3, myWins + delta)) : myWins;
    const newTheirWins = type === 'their' ? Math.max(0, Math.min(3, theirWins + delta)) : theirWins;
    
    // Don't allow total games to exceed 3
    if (newMyWins + newTheirWins > 3) return;
    
    setMyWins(newMyWins);
    setTheirWins(newTheirWins);
    setSubmitError(null);
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate: at least one player must have 2+ wins (to be a winner), or it's a draw (1-1)
    const totalGames = myWins + theirWins;
    const hasWinner = myWins >= 2 || theirWins >= 2;
    const isDraw = myWins === 1 && theirWins === 1;
    const validMatch = hasWinner || isDraw;
    
    if (!validMatch && totalGames > 0) {
      setSubmitError('Match must have a winner (2+ wins) or be a draw (1-1)');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Convert to API format (playerA/playerB perspective)
    const result: MatchResult = {
      playerAWins: isPlayerA ? myWins : theirWins,
      playerBWins: isPlayerA ? theirWins : myWins,
      isDraw: myWins === 1 && theirWins === 1, // 1-1-1 draw
    };

    const response = await reportMatchResult(
      eventId,
      match.id,
      result,
      currentPlayer.id
    );

    setIsSubmitting(false);

    if (response.error) {
      setSubmitError(response.error);
      return;
    }

    if (response.data) {
      if (response.data.alreadyReported) {
        // Another player already reported - show that result
        setAlreadyReported(true);
      }
      onResultReported();
    }
  };

  // Check if can submit
  const canSubmit = myWins > 0 || theirWins > 0;

  return (
    <div 
      data-component="PlayerMatchCard"
      data-state="input"
      className="player-match-card player-match-card--input bg-obsidian border border-storm rounded-xl p-6"
    >
      {/* Header */}
      <div className="player-match-card__header text-center mb-6">
        <p className="player-match-card__vs-text text-sm text-mist uppercase tracking-wide mb-1">
          Your Match
        </p>
        <p className="player-match-card__opponent-name text-xl font-bold text-snow">
          You vs. {opponent?.name || 'Opponent'}
        </p>
      </div>

      {/* Score Input */}
      <div className="player-match-card__score-input flex items-center justify-center gap-8 mb-6">
        {/* My Wins */}
        <div className="player-match-card__my-wins-section text-center">
          <p className="player-match-card__label text-xs uppercase tracking-wide text-mist mb-2">
            Your Wins
          </p>
          <div className="player-match-card__counter flex items-center gap-3">
            <button
              onClick={() => adjustScore('my', -1)}
              disabled={myWins === 0 || isSubmitting}
              className={cn(
                'player-match-card__counter-btn player-match-card__counter-btn--minus',
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                myWins === 0 || isSubmitting
                  ? 'bg-slate text-mist/50 cursor-not-allowed'
                  : 'bg-slate text-snow hover:bg-storm'
              )}
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="player-match-card__counter-value text-4xl font-bold text-arcane w-12 text-center">
              {myWins}
            </span>
            <button
              onClick={() => adjustScore('my', 1)}
              disabled={myWins === 3 || myWins + theirWins >= 3 || isSubmitting}
              className={cn(
                'player-match-card__counter-btn player-match-card__counter-btn--plus',
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                myWins === 3 || myWins + theirWins >= 3 || isSubmitting
                  ? 'bg-slate text-mist/50 cursor-not-allowed'
                  : 'bg-slate text-snow hover:bg-storm'
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Separator */}
        <span className="player-match-card__separator text-2xl text-mist">-</span>

        {/* Their Wins */}
        <div className="player-match-card__their-wins-section text-center">
          <p className="player-match-card__label text-xs uppercase tracking-wide text-mist mb-2">
            {opponent?.name?.split(' ')[0] || 'Their'}'s Wins
          </p>
          <div className="player-match-card__counter flex items-center gap-3">
            <button
              onClick={() => adjustScore('their', -1)}
              disabled={theirWins === 0 || isSubmitting}
              className={cn(
                'player-match-card__counter-btn player-match-card__counter-btn--minus',
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                theirWins === 0 || isSubmitting
                  ? 'bg-slate text-mist/50 cursor-not-allowed'
                  : 'bg-slate text-snow hover:bg-storm'
              )}
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="player-match-card__counter-value text-4xl font-bold text-snow w-12 text-center">
              {theirWins}
            </span>
            <button
              onClick={() => adjustScore('their', 1)}
              disabled={theirWins === 3 || myWins + theirWins >= 3 || isSubmitting}
              className={cn(
                'player-match-card__counter-btn player-match-card__counter-btn--plus',
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                theirWins === 3 || myWins + theirWins >= 3 || isSubmitting
                  ? 'bg-slate text-mist/50 cursor-not-allowed'
                  : 'bg-slate text-snow hover:bg-storm'
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="player-match-card__error flex items-center gap-2 justify-center mb-4 text-danger text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="player-match-card__submit-btn w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          'Report Result'
        )}
      </Button>

      {/* Hint */}
      <p className="player-match-card__hint text-xs text-mist text-center mt-4">
        Either player can report the result
      </p>
    </div>
  );
};

