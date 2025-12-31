import type { EventSession } from '@/types/event';

const API_BASE = '/api';
const LOCAL_STORAGE_PREFIX = 'ripper_event:';

// Check if we're in local development mode (Vite dev server)
const isLocalDev = import.meta.env.DEV;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Local storage helpers for development fallback
function saveToLocalStorage(eventId: string, event: EventSession): void {
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${eventId}`, JSON.stringify(event));
}

function getFromLocalStorage(eventId: string): EventSession | null {
  const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${eventId}`);
  return data ? JSON.parse(data) : null;
}

export async function createEventSession(
  event: EventSession
): Promise<ApiResponse<EventSession>> {
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }
    
    const data = await response.json();
    return { data };
  } catch (err) {
    // Fallback to localStorage in local development
    if (isLocalDev) {
      console.warn('[Dev Mode] API unavailable, using localStorage fallback');
      saveToLocalStorage(event.id, event);
      return { data: event };
    }
    return { error: 'Network error. Please try again.' };
  }
}

export async function getEventSession(
  eventId: string
): Promise<ApiResponse<EventSession>> {
  try {
    const response = await fetch(`${API_BASE}/event/${eventId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Event not found');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to load event');
    }
    
    const data = await response.json();
    return { data };
  } catch (err) {
    // Fallback to localStorage in local development
    if (isLocalDev) {
      console.warn('[Dev Mode] API unavailable, using localStorage fallback');
      const localEvent = getFromLocalStorage(eventId);
      if (localEvent) {
        return { data: localEvent };
      }
      return { error: 'Event not found (local)' };
    }
    return { error: err instanceof Error ? err.message : 'Network error. Please try again.' };
  }
}

export async function updateEventSession(
  eventId: string,
  event: EventSession
): Promise<ApiResponse<EventSession>> {
  try {
    const response = await fetch(`${API_BASE}/event/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update event');
    }
    
    const data = await response.json();
    return { data };
  } catch (err) {
    // Fallback to localStorage in local development
    if (isLocalDev) {
      console.warn('[Dev Mode] API unavailable, using localStorage fallback');
      saveToLocalStorage(eventId, event);
      return { data: event };
    }
    return { error: 'Network error. Please try again.' };
  }
}

// Verify password - with local fallback for dev
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify password');
    }
    
    const data = await response.json();
    return data.valid === true;
  } catch (err) {
    // In local dev, accept "0117" as the password
    if (isLocalDev) {
      console.warn('[Dev Mode] API unavailable, using local password check');
      return password === '0117';
    }
    return false;
  }
}

// Get event by code - with local fallback for dev
export async function getEventByCode(
  code: string
): Promise<ApiResponse<EventSession>> {
  try {
    const response = await fetch(`${API_BASE}/event/code/${code.toUpperCase()}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Event not found');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to lookup event');
    }
    
    const data = await response.json();
    return { data };
  } catch (err) {
    // Fallback to localStorage in local development - search by code
    if (isLocalDev) {
      console.warn('[Dev Mode] API unavailable, searching localStorage by code');
      const normalizedCode = code.toUpperCase();
      
      // Search all localStorage keys for matching event code
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
          const eventData = localStorage.getItem(key);
          if (eventData) {
            const event = JSON.parse(eventData) as EventSession;
            if (event.eventCode === normalizedCode) {
              return { data: event };
            }
          }
        }
      }
      return { error: 'Event not found (local)' };
    }
    return { error: err instanceof Error ? err.message : 'Network error. Please try again.' };
  }
}

// Check if an event code is available
export async function checkCodeAvailable(code: string): Promise<boolean> {
  const result = await getEventByCode(code);
  return !result.data; // Available if no event found with this code
}
