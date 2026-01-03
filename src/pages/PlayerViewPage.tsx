import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, RefreshCw, UserCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  PlayerSelectModal,
  PlayerSetupView,
  PlayerDraftView,
  PlayerDeckbuildingView,
  PlayerRoundView,
  PlayerResultsView,
  getStoredPlayerId,
  clearStoredPlayerId,
} from '@/components/player';
import { useEventPolling, getCurrentStage } from '@/hooks/useEventPolling';
import { parseCompositeId, createCompositeId } from '@/lib/generateId';
import { clearHostAuth } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Player } from '@/types/event';

export const PlayerViewPage = () => {
  const navigate = useNavigate();
  const { eventId: rawEventId } = useParams<{ eventId: string }>();
  
  // Parse composite ID to get the actual event ID
  const parsed = rawEventId ? parseCompositeId(rawEventId) : null;
  const eventId = parsed?.id || rawEventId;
  
  // Player selection state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);

  // Use polling hook to keep event in sync
  const { event, isLoading, error, lastUpdated, refetch } = useEventPolling(eventId);

  // Check for stored player ID on mount
  useEffect(() => {
    if (eventId) {
      const storedId = getStoredPlayerId(eventId);
      if (storedId) {
        setSelectedPlayerId(storedId);
      } else {
        setShowPlayerSelect(true);
      }
    }
  }, [eventId]);

  // Verify stored player still exists in event
  useEffect(() => {
    if (event && selectedPlayerId) {
      const playerExists = event.players.some(p => p.id === selectedPlayerId);
      if (!playerExists) {
        // Player no longer in event, clear selection
        if (eventId) {
          clearStoredPlayerId(eventId);
        }
        setSelectedPlayerId(null);
        setShowPlayerSelect(true);
      }
    }
  }, [event, selectedPlayerId, eventId]);

  // Handle player selection
  const handlePlayerSelect = useCallback((playerId: string) => {
    setSelectedPlayerId(playerId);
    setShowPlayerSelect(false);
  }, []);

  // Handle changing player
  const handleChangePlayer = useCallback(() => {
    if (eventId) {
      clearStoredPlayerId(eventId);
    }
    setSelectedPlayerId(null);
    setShowPlayerSelect(true);
  }, [eventId]);

  // Handle result reported (trigger refetch)
  const handleResultReported = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle admin access - navigate to admin pages
  const handleAdminAccess = useCallback(() => {
    if (!event) return;
    const compositeId = createCompositeId(event.eventCode, event.id);
    // Navigate to appropriate admin page based on current phase
    switch (event.currentPhase) {
      case 'drafting':
        navigate(`/event/${compositeId}/draft`);
        break;
      case 'deckbuilding':
        navigate(`/event/${compositeId}/deckbuilding`);
        break;
      case 'rounds':
        navigate(`/event/${compositeId}/round/${event.currentRound}`);
        break;
      case 'complete':
        navigate(`/event/${compositeId}/results`);
        break;
      default:
        navigate(`/event/${compositeId}`);
    }
  }, [event, navigate]);

  // Handle admin access from footer (requires password)
  const handleAdminAccessFromFooter = useCallback(() => {
    if (!event) return;
    clearHostAuth(); // Clear any existing auth so password is required
    const compositeId = createCompositeId(event.eventCode, event.id);
    navigate(`/event/${compositeId}`);
  }, [event, navigate]);

  // Get the current player object
  const currentPlayer: Player | null = event && selectedPlayerId
    ? event.players.find(p => p.id === selectedPlayerId) || null
    : null;

  // Get current stage for rendering
  const stage = getCurrentStage(event);

  // Loading state
  if (isLoading && !event) {
    return (
      <div 
        data-page="PlayerViewPage"
        data-state="loading"
        className="player-view-page player-view-page--loading min-h-screen bg-midnight flex items-center justify-center"
      >
        <div className="player-view-page__loader animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div 
        data-page="PlayerViewPage"
        data-state="error"
        className="player-view-page player-view-page--error min-h-screen bg-midnight flex flex-col items-center justify-center gap-4 px-4"
      >
        <p className="player-view-page__error-message text-danger text-center">{error}</p>
        <Button onClick={() => navigate('/')} className="player-view-page__back-btn">
          Back to Home
        </Button>
      </div>
    );
  }

  // No event
  if (!event) {
    return (
      <div 
        data-page="PlayerViewPage"
        data-state="not-found"
        className="player-view-page player-view-page--not-found min-h-screen bg-midnight flex flex-col items-center justify-center gap-4 px-4"
      >
        <p className="player-view-page__not-found-message text-mist">Event not found</p>
        <Button onClick={() => navigate('/')} className="player-view-page__back-btn">
          Back to Home
        </Button>
      </div>
    );
  }

  // Player selection modal
  if (showPlayerSelect) {
    return (
      <div 
        data-page="PlayerViewPage"
        data-state="select-player"
        className="player-view-page player-view-page--select min-h-screen bg-midnight"
      >
        <PlayerSelectModal
          players={event.players}
          eventId={event.id}
          onSelect={handlePlayerSelect}
          onAdminAccess={handleAdminAccess}
        />
      </div>
    );
  }

  // No player selected (shouldn't happen but just in case)
  if (!currentPlayer) {
    return (
      <div 
        data-page="PlayerViewPage"
        data-state="no-player"
        className="player-view-page player-view-page--no-player min-h-screen bg-midnight flex flex-col items-center justify-center gap-4 px-4"
      >
        <p className="player-view-page__no-player-message text-mist">Please select your player</p>
        <Button onClick={() => setShowPlayerSelect(true)}>
          Select Player
        </Button>
      </div>
    );
  }

  // Render appropriate view based on stage
  const renderContent = () => {
    if (!stage) return null;

    // Setup phase
    if (stage === 'setup:configuring') {
      return <PlayerSetupView event={event} player={currentPlayer} />;
    }

    // Draft phases
    if (stage.startsWith('draft:')) {
      return <PlayerDraftView event={event} player={currentPlayer} />;
    }

    // Deckbuilding phases
    if (stage.startsWith('deckbuilding:')) {
      return <PlayerDeckbuildingView event={event} player={currentPlayer} />;
    }

    // Round phases
    if (stage.startsWith('round:')) {
      return (
        <PlayerRoundView 
          event={event} 
          player={currentPlayer}
          onResultReported={handleResultReported}
        />
      );
    }

    // Complete
    if (stage === 'complete:final') {
      return <PlayerResultsView event={event} player={currentPlayer} />;
    }

    return null;
  };

  // Format last updated
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div 
      data-page="PlayerViewPage"
      data-stage={stage}
      data-event-id={event.id}
      data-player-id={currentPlayer.id}
      className="player-view-page min-h-screen bg-midnight flex flex-col"
    >
      {/* Header */}
      <header className="player-view-page__header border-b border-storm bg-obsidian/50 sticky top-0 z-10">
        <div className="player-view-page__header-container max-w-4xl mx-auto px-4 py-3">
          <div className="player-view-page__header-row flex items-center justify-between">
            {/* Left: Home */}
            <button
              onClick={() => navigate('/')}
              className="player-view-page__home-btn p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
              title="Go to Home"
            >
              <Home className="w-5 h-5" />
            </button>

            {/* Center: Event Code */}
            <div className="player-view-page__event-info text-center">
              <p className="player-view-page__event-code text-xs text-mist uppercase tracking-wide">
                Event <span className="text-arcane font-mono font-bold">{event.eventCode}</span>
              </p>
            </div>

            {/* Right: Player info + refresh */}
            <div className="player-view-page__actions flex items-center gap-2">
              <button
                onClick={handleChangePlayer}
                className="player-view-page__change-player-btn flex items-center gap-1.5 px-2 py-1.5 text-sm text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate"
                title="Change player"
              >
                <UserCircle className="w-4 h-4" />
                <span className="player-view-page__player-name hidden sm:inline max-w-[100px] truncate">
                  {currentPlayer.name}
                </span>
              </button>
              <button
                onClick={() => refetch()}
                className={cn(
                  'player-view-page__refresh-btn p-2 text-mist hover:text-snow transition-colors rounded-lg hover:bg-slate',
                  isLoading && 'animate-spin'
                )}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="player-view-page__main flex-1">
        {renderContent()}
      </main>

      {/* Footer Status */}
      <footer className="player-view-page__footer border-t border-storm bg-obsidian/50 py-2">
        <div className="player-view-page__footer-container max-w-4xl mx-auto px-4 flex items-center justify-between text-xs text-mist">
          <span className="player-view-page__sync-status">
            {isLoading ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
                Syncing...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-success rounded-full" />
                Updated {formatLastUpdated()}
              </span>
            )}
          </span>
          
          {/* Admin Access Link */}
          <button
            onClick={handleAdminAccessFromFooter}
            className="player-view-page__admin-link flex items-center gap-1 text-mist hover:text-warning transition-colors"
            title="Admin access (requires password)"
          >
            <Lock className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

