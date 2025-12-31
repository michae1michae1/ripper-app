import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Event code is required' });
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase();

    // Look up the event ID by code
    const eventId = await kv.get<string>(`eventCode:${normalizedCode}`);
    
    if (!eventId) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get the full event data
    const eventData = await kv.get(`event:${eventId}`);
    
    if (!eventData) {
      // Code exists but event expired - clean up
      await kv.del(`eventCode:${normalizedCode}`);
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
    return res.status(200).json(event);
  } catch (error) {
    console.error('Error looking up event by code:', error);
    return res.status(500).json({ message: 'Failed to lookup event' });
  }
}

