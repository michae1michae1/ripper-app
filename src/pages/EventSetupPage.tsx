import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, AlertTriangle, Pencil, Check, X } from 'lucide-react';
import { Button, PasswordKeypad, isHostAuthenticated } from '@/components/ui';
import { EventTypeSelector, SetSelector, PlayerList } from '@/components/event';
import { useEventStore } from '@/lib/store';
import { createEventSession, getEventSession, updateEventSession, checkCodeAvailable } from '@/lib/api';
import { parseCompositeId, createCompositeId } from '@/lib/generateId';
import type { EventType } from '@/types/event';
import { MIN_PLAYERS } from '@/lib/constants';

export const EventSetupPage = () => {
  const navigate = useNavigate();
  const { eventId: rawEventId } = useParams<{ eventId: string }>();
  
  // Parse composite ID to get the actual event ID
  const eventId = rawEventId ? (parseCompositeId(rawEventId)?.id || rawEventId) : undefined;
  
  const [eventType, setEventType] = useState<EventType>('draft');
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showHostInput, setShowHostInput] = useState(!eventId);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Event code editing state
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editingCode, setEditingCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  
  const {
    event,
    createEvent,
    loadEvent,
    addPlayer,
    removePlayer,
    randomizeSeating,
    startEvent,
    resetEvent,
    updateEventCode,
    setEventSet,
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
    // Check if we need to load: no event, or event ID mismatch (switching events)
    const needsLoad = eventId && isAuthenticated && (!event || event.id !== eventId);
    if (needsLoad) {
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

  const getCompositeId = () => {
    if (!event) return '';
    return createCompositeId(event.eventCode, event.id);
  };

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleGoBack = () => {
    // Go back to current phase based on event state
    if (event) {
      const compositeId = getCompositeId();
      if (event.currentPhase === 'drafting') {
        navigate(`/event/${compositeId}/draft`);
      } else if (event.currentPhase === 'deckbuilding') {
        navigate(`/event/${compositeId}/deckbuilding`);
      } else if (event.currentPhase === 'rounds') {
        navigate(`/event/${compositeId}/round/${event.currentRound}`);
      } else if (event.currentPhase === 'complete') {
        navigate(`/event/${compositeId}/results`);
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
    const compositeId = createCompositeId(newEvent.eventCode, newEvent.id);
    navigate(`/event/${compositeId}`, { replace: true });
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
    
    const compositeId = getCompositeId();
    const nextPath = event.type === 'draft'
      ? `/event/${compositeId}/draft`
      : `/event/${compositeId}/deckbuilding`;
    navigate(nextPath);
  };

  const handleResetEvent = async () => {
    if (!event) return;
    resetEvent();
    await updateEventSession(event.id, useEventStore.getState().event!);
    setShowResetConfirm(false);
  };

  const handleEditCode = () => {
    if (!event) return;
    setEditingCode(event.eventCode);
    setCodeError('');
    setIsEditingCode(true);
  };

  const handleCancelEditCode = () => {
    setIsEditingCode(false);
    setEditingCode('');
    setCodeError('');
  };

  const handleSaveCode = async () => {
    if (!event) return;
    
    const normalizedCode = editingCode.toUpperCase().trim();
    
    // Validate format
    if (!/^[A-Z0-9]{4}$/.test(normalizedCode)) {
      setCodeError('Code must be exactly 4 characters (letters and numbers)');
      return;
    }
    
    // Skip if unchanged
    if (normalizedCode === event.eventCode) {
      setIsEditingCode(false);
      return;
    }
    
    // Check availability
    setIsCheckingCode(true);
    const isAvailable = await checkCodeAvailable(normalizedCode);
    setIsCheckingCode(false);
    
    if (!isAvailable) {
      setCodeError('This code is already in use');
      return;
    }
    
    // Update the code
    updateEventCode(normalizedCode);
    await updateEventSession(event.id, useEventStore.getState().event!);
    
    // Update URL with new composite ID
    const newCompositeId = createCompositeId(normalizedCode, event.id);
    navigate(`/event/${newCompositeId}`, { replace: true });
    
    setIsEditingCode(false);
    setEditingCode('');
  };

  const canStart = event && event.players.length >= MIN_PLAYERS;
  const hasProgress = event && event.currentPhase !== 'setup';

  // Show password keypad for existing events if not authenticated
  if (eventId && !isAuthenticated) {
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
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
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
            {/* Event Code Display */}
            <div className="bg-obsidian border border-storm rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-mist uppercase tracking-wide">
                  Event Code
                </label>
                {!isEditingCode && (
                  <button
                    onClick={handleEditCode}
                    className="flex items-center gap-1 text-sm text-mist hover:text-snow transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingCode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingCode}
                      onChange={(e) => {
                        setEditingCode(e.target.value.toUpperCase().slice(0, 4));
                        setCodeError('');
                      }}
                      className="flex-1 px-4 py-3 bg-slate border border-storm rounded-xl text-snow text-2xl font-mono tracking-widest text-center focus:outline-none focus:border-arcane transition-colors uppercase"
                      maxLength={4}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveCode}
                      disabled={isCheckingCode}
                      className="text-success hover:bg-success/10"
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEditCode}
                      className="text-mist hover:text-danger"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  {codeError && (
                    <p className="text-danger text-sm">{codeError}</p>
                  )}
                  {isCheckingCode && (
                    <p className="text-mist text-sm">Checking availability...</p>
                  )}
                </div>
              ) : (
                <div className="text-4xl font-mono tracking-widest text-arcane font-bold">
                  {event.eventCode}
                </div>
              )}
              
              <p className="text-sm text-mist mt-3">
                Share this code with players so they can join from the homepage
              </p>
            </div>

            <EventTypeSelector
              value={event.type}
              onChange={async (type) => {
                useEventStore.setState((state) => ({
                  event: state.event ? { ...state.event, type } : null,
                }));
                await updateEventSession(event.id, useEventStore.getState().event!);
              }}
            />

            <SetSelector
              value={{ code: event.setCode, name: event.setName }}
              onChange={async (code, name) => {
                setEventSet(code, name);
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
