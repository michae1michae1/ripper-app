import { useState, useEffect, useCallback, useRef } from 'react';
import { getEventSession } from '@/lib/api';
import type { EventSession, EventStage } from '@/types/event';

interface UseEventPollingResult {
  event: EventSession | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
}

/**
 * Derives the granular EventStage from an EventSession
 */
export function getCurrentStage(event: EventSession | null): EventStage | null {
  if (!event) return null;

  switch (event.currentPhase) {
    case 'setup':
      return 'setup:configuring';

    case 'drafting': {
      if (!event.draftState) return 'draft:pack1_paused';
      
      if (event.draftState.isComplete) {
        return 'draft:complete';
      }
      
      const pack = event.draftState.currentPack;
      const isPaused = event.draftState.isPaused;
      
      if (pack === 1) return isPaused ? 'draft:pack1_paused' : 'draft:pack1_active';
      if (pack === 2) return isPaused ? 'draft:pack2_paused' : 'draft:pack2_active';
      return isPaused ? 'draft:pack3_paused' : 'draft:pack3_active';
    }

    case 'deckbuilding': {
      if (!event.deckbuildingState) return 'deckbuilding:paused';
      
      // Check if explicitly marked complete
      if (event.deckbuildingState.isComplete) {
        return 'deckbuilding:complete';
      }
      
      // Check if timer has expired
      const { timerStartedAt, timerPausedAt, timerDuration, isPaused } = event.deckbuildingState;
      
      if (timerStartedAt) {
        const elapsed = isPaused && timerPausedAt
          ? (timerPausedAt - timerStartedAt) / 1000
          : (Date.now() - timerStartedAt) / 1000;
        
        if (elapsed >= timerDuration) {
          return 'deckbuilding:complete';
        }
      }
      
      return isPaused ? 'deckbuilding:paused' : 'deckbuilding:active';
    }

    case 'rounds': {
      const currentRound = event.rounds.find(r => r.roundNumber === event.currentRound);
      if (!currentRound) {
        return `round:${event.currentRound}_paused`;
      }
      
      return currentRound.isPaused 
        ? `round:${event.currentRound}_paused`
        : `round:${event.currentRound}_active`;
    }

    case 'complete':
      return 'complete:final';

    default:
      return 'setup:configuring';
  }
}

/**
 * Hook that polls the API for event updates at a specified interval
 */
export function useEventPolling(
  eventId: string | undefined,
  intervalMs = 3000
): UseEventPollingResult {
  const [event, setEvent] = useState<EventSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  // Use ref to avoid stale closures in interval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      setIsLoading(false);
      setError('No event ID provided');
      return;
    }

    try {
      const { data, error: apiError } = await getEventSession(eventId);
      
      if (!isMountedRef.current) return;
      
      if (data) {
        setEvent(data);
        setError(null);
        setLastUpdated(Date.now());
      } else {
        setError(apiError || 'Event not found');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError('Failed to fetch event');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [eventId]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);
    fetchEvent();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchEvent]);

  // Polling interval
  useEffect(() => {
    if (!eventId) return;

    intervalRef.current = setInterval(() => {
      fetchEvent();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [eventId, intervalMs, fetchEvent]);

  return {
    event,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchEvent,
  };
}

