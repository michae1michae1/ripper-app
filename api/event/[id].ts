import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// TTL: 24 hours in seconds
const EVENT_TTL = 60 * 60 * 24;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid event ID' });
  }
  
  if (req.method === 'GET') {
    try {
      const eventData = await kv.get(`event:${id}`);
      
      if (!eventData) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const event = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
      return res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      return res.status(500).json({ message: 'Failed to fetch event' });
    }
  }
  
  if (req.method === 'PUT') {
    try {
      const event = req.body;
      
      if (!event) {
        return res.status(400).json({ message: 'Event data is required' });
      }
      
      // Verify event exists first
      const existingData = await kv.get(`event:${id}`);
      if (!existingData) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const existingEvent = typeof existingData === 'string' ? JSON.parse(existingData) : existingData;
      
      // If event code changed, update the mapping
      if (event.eventCode && event.eventCode !== existingEvent.eventCode) {
        // Remove old code mapping if it exists
        if (existingEvent.eventCode) {
          await kv.del(`eventCode:${existingEvent.eventCode}`);
        }
        // Add new code mapping
        await kv.set(`eventCode:${event.eventCode}`, id, { ex: EVENT_TTL });
      } else if (event.eventCode) {
        // Refresh TTL on existing code mapping
        await kv.set(`eventCode:${event.eventCode}`, id, { ex: EVENT_TTL });
      }
      
      // Update with refreshed TTL
      await kv.set(`event:${id}`, JSON.stringify(event), { ex: EVENT_TTL });
      
      return res.status(200).json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({ message: 'Failed to update event' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

