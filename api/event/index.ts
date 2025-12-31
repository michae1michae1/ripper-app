import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// TTL: 24 hours in seconds
const EVENT_TTL = 60 * 60 * 24;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const event = req.body;
      
      if (!event?.id) {
        return res.status(400).json({ message: 'Event ID is required' });
      }
      
      // Store in KV with TTL
      await kv.set(`event:${event.id}`, JSON.stringify(event), { ex: EVENT_TTL });
      
      // Also store the code -> id mapping if eventCode exists
      if (event.eventCode) {
        await kv.set(`eventCode:${event.eventCode}`, event.id, { ex: EVENT_TTL });
      }
      
      return res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      return res.status(500).json({ message: 'Failed to create event' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

