import { Clock, Users } from 'lucide-react';
import type { EventSession, Player } from '@/types/event';

interface PlayerSetupViewProps {
  event: EventSession;
  player: Player;
}

export const PlayerSetupView = ({ event, player }: PlayerSetupViewProps) => {
  return (
    <div 
      data-component="PlayerSetupView"
      className="player-setup-view flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
    >
      {/* Waiting Animation */}
      <div className="player-setup-view__animation mb-8">
        <div className="player-setup-view__pulse-ring relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-arcane/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-arcane/30 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-obsidian flex items-center justify-center">
            <Clock className="player-setup-view__clock-icon w-8 h-8 text-arcane" />
          </div>
        </div>
      </div>

      {/* Message */}
      <h2 className="player-setup-view__title text-2xl sm:text-3xl font-bold text-snow mb-3">
        Waiting to Start
      </h2>
      <p className="player-setup-view__subtitle text-mist mb-8 max-w-md">
        The host is setting up the event. You'll automatically see the next screen when it begins.
      </p>

      {/* Player Info */}
      <div className="player-setup-view__info bg-obsidian border border-storm rounded-xl p-4 sm:p-6 max-w-sm w-full">
        <div className="player-setup-view__info-header flex items-center justify-between mb-4">
          <span className="player-setup-view__info-label text-xs uppercase tracking-wide text-mist">
            Your Info
          </span>
          <span className="player-setup-view__seat-badge px-2 py-0.5 bg-arcane/20 text-arcane text-xs font-medium rounded-full">
            Seat {player.seatNumber}
          </span>
        </div>
        
        <p className="player-setup-view__player-name text-xl font-semibold text-snow mb-4">
          {player.name}
        </p>

        <div className="player-setup-view__event-details space-y-2 text-sm text-silver">
          <div className="player-setup-view__event-type flex items-center gap-2">
            <span className="player-setup-view__event-type-icon">
              {event.type === 'draft' ? '📦' : '✉️'}
            </span>
            <span className="player-setup-view__event-type-text">
              {event.type === 'draft' ? 'Booster Draft' : 'Sealed Deck'}
            </span>
          </div>
          <div className="player-setup-view__player-count flex items-center gap-2">
            <Users className="player-setup-view__users-icon w-4 h-4 text-mist" />
            <span className="player-setup-view__player-count-text">
              {event.players.length} players registered
            </span>
          </div>
          {event.setName && (
            <div className="player-setup-view__set flex items-center gap-2">
              <span className="player-setup-view__set-icon">🃏</span>
              <span className="player-setup-view__set-text">{event.setName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hint */}
      <p className="player-setup-view__hint text-xs text-mist mt-6">
        This page updates automatically • No need to refresh
      </p>
    </div>
  );
};

