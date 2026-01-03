import { useState } from 'react';
import { User, Check, Lock, Delete } from 'lucide-react';
import { Button, Avatar } from '@/components/ui';
import { verifyPassword } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Player } from '@/types/event';

interface PlayerSelectModalProps {
  players: Player[];
  eventId: string;
  onSelect: (playerId: string) => void;
  onAdminAccess: () => void; // Called when host authenticates successfully
}

/**
 * Get the stored player ID for an event from sessionStorage
 */
export function getStoredPlayerId(eventId: string): string | null {
  return sessionStorage.getItem(`player_${eventId}`);
}

/**
 * Store the player ID selection for an event
 */
export function setStoredPlayerId(eventId: string, playerId: string): void {
  sessionStorage.setItem(`player_${eventId}`, playerId);
}

/**
 * Clear the stored player ID for an event
 */
export function clearStoredPlayerId(eventId: string): void {
  sessionStorage.removeItem(`player_${eventId}`);
}

export const PlayerSelectModal = ({ 
  players, 
  eventId,
  onSelect,
  onAdminAccess,
}: PlayerSelectModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleConfirm = () => {
    if (!selectedId) return;
    
    // Check if selected player is the host
    const selectedPlayer = players.find(p => p.id === selectedId);
    if (selectedPlayer?.isHost) {
      // Show password prompt for host
      setShowPasswordPrompt(true);
      return;
    }
    
    // Regular player - just select
    setStoredPlayerId(eventId, selectedId);
    onSelect(selectedId);
  };

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError('');
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setPinError('');
  };

  const verifyPin = async (pinToVerify: string) => {
    setIsVerifying(true);
    setPinError('');

    try {
      const isValid = await verifyPassword(pinToVerify);

      if (isValid) {
        // Store auth in sessionStorage
        sessionStorage.setItem('host_authenticated', 'true');
        // Navigate to admin
        onAdminAccess();
      } else {
        setPinError('Incorrect PIN');
        setPin('');
      }
    } catch {
      setPinError('Failed to verify. Try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToSelect = () => {
    setShowPasswordPrompt(false);
    setPin('');
    setPinError('');
    setSelectedId(null);
  };

  // Sort players by seat number
  const sortedPlayers = [...players].sort((a, b) => a.seatNumber - b.seatNumber);

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  // Password prompt for host
  if (showPasswordPrompt) {
    return (
      <div 
        data-component="PlayerSelectModal"
        data-state="password"
        className="player-select-modal fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div className="player-select-modal__content bg-obsidian border border-storm rounded-2xl p-6 max-w-md w-full shadow-2xl">
          {/* Header */}
          <div className="player-select-modal__header text-center mb-6">
            <div className="player-select-modal__icon-wrapper w-16 h-16 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="player-select-modal__icon w-8 h-8 text-warning" />
            </div>
            <h2 className="player-select-modal__title text-2xl font-bold text-snow mb-2">
              Host Access
            </h2>
            <p className="player-select-modal__subtitle text-mist">
              Enter admin PIN to manage this event
            </p>
          </div>

          {/* PIN Display */}
          <div className="player-select-modal__pin-display flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                data-filled={pin.length > i || undefined}
                className={cn(
                  'player-select-modal__pin-digit',
                  'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all',
                  pin.length > i
                    ? 'border-warning bg-warning/20 text-snow'
                    : 'border-storm bg-slate text-mist'
                )}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {pinError && (
            <p className="player-select-modal__pin-error text-danger text-sm text-center mb-4 animate-pulse">
              {pinError}
            </p>
          )}

          {/* Keypad */}
          <div className="player-select-modal__keypad grid grid-cols-3 gap-2 mb-6">
            {numbers.map((num, index) => {
              if (num === '') {
                return <div key={index} className="player-select-modal__empty-cell w-full h-12" />;
              }
              
              if (num === 'del') {
                return (
                  <button
                    key={index}
                    onClick={handleDelete}
                    disabled={isVerifying || pin.length === 0}
                    className="player-select-modal__key player-select-modal__key--delete w-full h-12 rounded-xl bg-slate border border-storm flex items-center justify-center text-mist hover:bg-storm hover:text-snow transition-all disabled:opacity-50"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                );
              }

              return (
                <button
                  key={index}
                  data-key={num}
                  onClick={() => handleNumberPress(num)}
                  disabled={isVerifying}
                  className="player-select-modal__key player-select-modal__key--number w-full h-12 rounded-xl bg-slate border border-storm text-xl font-semibold text-snow hover:bg-storm hover:border-warning transition-all disabled:opacity-50 active:scale-95"
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Loading indicator */}
          {isVerifying && (
            <div className="player-select-modal__verifying flex items-center justify-center gap-2 text-mist mb-4">
              <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </div>
          )}

          {/* Back Button */}
          <Button
            variant="secondary"
            onClick={handleBackToSelect}
            className="player-select-modal__back-btn w-full"
          >
            Back to Player Selection
          </Button>

          {/* Join as player hint */}
          <p className="player-select-modal__hint text-xs text-mist text-center mt-4">
            Don't know the PIN? Go back and select a different player.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      data-component="PlayerSelectModal"
      className="player-select-modal fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="player-select-modal__content bg-obsidian border border-storm rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="player-select-modal__header text-center mb-6">
          <div className="player-select-modal__icon-wrapper w-16 h-16 bg-arcane/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="player-select-modal__icon w-8 h-8 text-arcane" />
          </div>
          <h2 className="player-select-modal__title text-2xl font-bold text-snow mb-2">
            Who are you?
          </h2>
          <p className="player-select-modal__subtitle text-mist">
            Select your name to see personalized event info
          </p>
        </div>

        {/* Player List */}
        <div className="player-select-modal__list space-y-2 mb-6 max-h-72 overflow-y-auto">
          {sortedPlayers.map((player) => (
            <button
              key={player.id}
              data-player-id={player.id}
              data-selected={selectedId === player.id || undefined}
              data-is-host={player.isHost || undefined}
              onClick={() => setSelectedId(player.id)}
              className={cn(
                'player-select-modal__player-btn',
                'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                'border-2',
                selectedId === player.id
                  ? player.isHost 
                    ? 'border-warning bg-warning/20'
                    : 'border-arcane bg-arcane/20'
                  : 'border-storm bg-slate hover:border-arcane/50 hover:bg-slate/80'
              )}
            >
              <Avatar name={player.name} size="md" />
              <div className="player-select-modal__player-info flex-1 text-left">
                <p className={cn(
                  'player-select-modal__player-name font-semibold',
                  selectedId === player.id ? 'text-snow' : 'text-silver'
                )}>
                  {player.name}
                </p>
                <p className="player-select-modal__player-seat text-xs text-mist">
                  Seat {player.seatNumber}
                  {player.isHost && (
                    <span className="ml-2 text-warning flex items-center gap-1 inline-flex">
                      <Lock className="w-3 h-3" />
                      Host/Admin
                    </span>
                  )}
                </p>
              </div>
              {selectedId === player.id && (
                <div className={cn(
                  'player-select-modal__check-wrapper w-8 h-8 rounded-full flex items-center justify-center',
                  player.isHost ? 'bg-warning' : 'bg-arcane'
                )}>
                  {player.isHost ? (
                    <Lock className="player-select-modal__lock-icon w-4 h-4 text-white" />
                  ) : (
                    <Check className="player-select-modal__check-icon w-5 h-5 text-white" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={!selectedId}
          className="player-select-modal__confirm-btn w-full"
          size="lg"
        >
          {selectedId && players.find(p => p.id === selectedId)?.isHost
            ? 'Continue as Admin'
            : 'Continue'
          }
        </Button>

        {/* Privacy Note */}
        <p className="player-select-modal__privacy-note text-xs text-mist text-center mt-4">
          {selectedId && players.find(p => p.id === selectedId)?.isHost
            ? 'Admin PIN required for host access'
            : 'Your selection is stored locally on this device'
          }
        </p>
      </div>
    </div>
  );
};

