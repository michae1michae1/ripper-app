import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [showHostInput, setShowHostInput] = useState(!eventId);
  
  const {
    event,
    createEvent,
    loadEvent,
    addPlayer,
    removePlayer,
    randomizeSeating,
    startEvent,
    setLoading,
    setError,
    isLoading,
    error,
  } = useEventStore();

  // Load existing event if eventId is provided
  useEffect(() => {
    if (eventId && !event) {
      setLoading(true);
      getEventSession(eventId).then(({ data, error: apiError }) => {
        if (data) {
          loadEvent(data);
        } else {
          setError(apiError || 'Event not found');
        }
      });
    }
  }, [eventId, event, loadEvent, setLoading, setError]);

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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const canStart = event && event.players.length >= MIN_PLAYERS;

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
              MM
            </div>
            <span className="font-semibold text-snow">ManaManager</span>
          </div>
          
          {event && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate rounded-full px-3 py-1.5">
                <LinkIcon className="w-4 h-4 text-mist" />
                <span className="text-sm text-silver font-mono">
                  {window.location.host}/j/{event.id}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-1 hover:bg-storm rounded transition-colors"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-mist" />
                  )}
                </button>
              </div>
              <Badge variant="success">Link Generated</Badge>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-mist hover:text-snow transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>

        <h1 className="text-3xl font-bold text-snow mb-8">Event Setup</h1>

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
    </div>
  );
};

