import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button, PasswordKeypad, isHostAuthenticated } from '@/components/ui';
import { EventTypeSelector, PlayerList } from '@/components/event';
import { useEventStore } from '@/lib/store';
import { createEventSession, getEventSession, updateEventSession } from '@/lib/api';
import type { EventType } from '@/types/event';
import { MIN_PLAYERS } from '@/lib/constants';

export const EventSetupPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [eventType, setEventType] = useState<EventType>('draft');
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showHostInput, setShowHostInput] = useState(!eventId);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const {
    event,
    createEvent,
    loadEvent,
    addPlayer,
    removePlayer,
    randomizeSeating,
    startEvent,
    resetEvent,
    setLoading,
    setError,
    isLoading,
    error,
  } = useEventStore();

  // Check if already authenticated on mount
  useEffect(() => {
    if (eventId) {
      setIsAuthenticated(isHostAuthenticated());
    } else {
      // New event creation doesn't need password
      setIsAuthenticated(true);
    }
  }, [eventId]);

  // Load existing event if eventId is provided and authenticated
  useEffect(() => {
    if (eventId && !event && isAuthenticated) {
      setLoading(true);
      getEventSession(eventId).then(({ data, error: apiError }) => {
        if (data) {
          loadEvent(data);
        } else {
          setError(apiError || 'Event not found');
        }
      });
    }
  }, [eventId, event, loadEvent, setLoading, setError, isAuthenticated]);

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleGoBack = () => {
    // Go back to current phase based on event state
    if (event) {
      if (event.currentPhase === 'drafting') {
        navigate(`/event/${event.id}/draft`);
      } else if (event.currentPhase === 'deckbuilding') {
        navigate(`/event/${event.id}/deckbuilding`);
      } else if (event.currentPhase === 'rounds') {
        navigate(`/event/${event.id}/round/${event.currentRound}`);
      } else if (event.currentPhase === 'complete') {
        navigate(`/event/${event.id}/results`);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleCreateEvent = async () => {
    if (!hostName.trim()) return;
    
    setIsCreating(true);
    const newEvent = createEvent(eventType, hostName.trim());
    
    const { error: apiError } = await createEventSession(newEvent);
    if (apiError) {
      setError(apiError);
      setIsCreating(false);
      return;
    }
    
    setShowHostInput(false);
    setIsCreating(false);
    navigate(`/event/${newEvent.id}`, { replace: true });
  };

  const handleAddPlayer = async (name: string) => {
    addPlayer(name);
    if (event) {
      await updateEventSession(event.id, useEventStore.getState().event!);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    removePlayer(playerId);
    if (event) {
      await updateEventSession(event.id, useEventStore.getState().event!);
    }
  };

  const handleRandomize = async () => {
    randomizeSeating();
    if (event) {
      await updateEventSession(event.id, useEventStore.getState().event!);
    }
  };

  const handleStartEvent = async () => {
    if (!event) return;
    startEvent();
    await updateEventSession(event.id, useEventStore.getState().event!);
    
    const nextPath = event.type === 'draft'
      ? `/event/${event.id}/draft`
      : `/event/${event.id}/deckbuilding`;
    navigate(nextPath);
  };

  const handleResetEvent = async () => {
    if (!event) return;
    resetEvent();
    await updateEventSession(event.id, useEventStore.getState().event!);
    setShowResetConfirm(false);
  };

  const canStart = event && event.players.length >= MIN_PLAYERS;
  const hasProgress = event && event.currentPhase !== 'setup';

  // Show password keypad for existing events if not authenticated
  if (eventId && !isAuthenticated) {
    // We need to load event first to know where "Go Back" should go
    // But we load it minimally just to check current phase
    return (
      <PasswordKeypad
        onSuccess={handlePasswordSuccess}
        onGoBack={handleGoBack}
        showGoBack={event?.currentPhase !== 'setup'}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-arcane border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-danger">{error}</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  // Show host name input for new events
  if (showHostInput) {
    return (
      <div className="min-h-screen bg-midnight">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-snow mb-2">Create New Event</h1>
          <p className="text-mist mb-8">Set up your MTG limited event</p>
          
          <div className="space-y-8">
            <EventTypeSelector value={eventType} onChange={setEventType} />
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-snow uppercase tracking-wide">
                Your Name (Host)
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                placeholder="Enter your name..."
                className="input"
                autoFocus
              />
            </div>
            
            <Button
              onClick={handleCreateEvent}
              isLoading={isCreating}
              disabled={!hostName.trim()}
              className="w-full"
              size="lg"
            >
              Create Event
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arcane rounded-lg flex items-center justify-center font-bold text-white text-sm">
              RL
            </div>
            <span className="font-semibold text-snow">Ripper Limit</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-mist hover:text-snow transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-snow">Event Setup</h1>
          {event && (
            <Button
              variant="ghost"
              onClick={() => setShowResetConfirm(true)}
              className="text-mist hover:text-danger"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Event
            </Button>
          )}
        </div>

        {event && (
          <div className="space-y-8">
            <EventTypeSelector
              value={event.type}
              onChange={async (type) => {
                useEventStore.setState((state) => ({
                  event: state.event ? { ...state.event, type } : null,
                }));
                await updateEventSession(event.id, useEventStore.getState().event!);
              }}
            />

            <PlayerList
              players={event.players}
              eventType={event.type}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onRandomize={handleRandomize}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      {event && (
        <footer className="fixed bottom-0 left-0 right-0 border-t border-storm bg-obsidian/95 backdrop-blur">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-snow font-medium">Ready to start?</p>
              <p className="text-sm text-mist">
                A new {event.type} instance will be created.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-mist hidden sm:block">⌘ + Enter to start</span>
              <Button
                onClick={handleStartEvent}
                disabled={!canStart}
                size="lg"
              >
                Start Event
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </footer>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian border border-storm rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-danger/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-snow">Reset Event?</h2>
                <p className="text-sm text-mist">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-silver mb-6">
              This will reset all progress including:
            </p>
            <ul className="text-mist text-sm space-y-1 mb-6 ml-4">
              <li>• All rounds and match results</li>
              <li>• Draft/deckbuilding progress</li>
              <li>• Timer states</li>
              {hasProgress && (
                <li className="text-warning">• Current phase: {event?.currentPhase}</li>
              )}
            </ul>
            <p className="text-silver mb-6">
              Players will be kept but the event will return to setup.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleResetEvent}
                className="flex-1 bg-danger hover:bg-danger/80"
              >
                Yes, Reset Event
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
