import type { EventSession } from '@/types/event';

const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
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
      return { error: error.message || 'Failed to create event' };
    }
    
    const data = await response.json();
    return { data };
  } catch (err) {
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
        return { error: 'Event not found' };
      }
      const error = await response.json();
      return { error: error.message || 'Failed to load event' };
    }
    
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error. Please try again.' };
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
      return { error: error.message || 'Failed to update event' };
    }
    
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error. Please try again.' };
  }
}

