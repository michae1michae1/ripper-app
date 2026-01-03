import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// TTL: 24 hours in seconds
const EVENT_TTL = 60 * 60 * 24;

interface MatchResult {
  playerAWins: number;
  playerBWins: number;
  isDraw: boolean;
}

interface Match {
  id: string;
  tableNumber: number;
  playerAId: string;
  playerBId: string | null;
  result: MatchResult | null;
  reportedBy?: string;
  reportedAt?: number;
}

interface Round {
  roundNumber: number;
  matches: Match[];
  isComplete: boolean;
  timerStartedAt: number | null;
  timerPausedAt: number | null;
  timerDuration: number;
  isPaused: boolean;
}

interface EventSession {
  id: string;
  eventCode: string;
  rounds: Round[];
  updatedAt: number;
  [key: string]: unknown;
}

/**
 * Atomic match result update endpoint
 * 
 * This endpoint handles race conditions when both players try to report
 * the same match result simultaneously. Only the first submission wins;
 * subsequent attempts receive the already-reported result.
 * 
 * PUT /api/event/:id/match/:matchId
 * Body: { result: MatchResult, reportedBy: string }
 * 
 * Response:
 * - { success: true, alreadyReported: false, result: MatchResult } - First to report
 * - { success: true, alreadyReported: true, result: MatchResult } - Already reported
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, matchId } = req.query;

  if (typeof id !== 'string' || typeof matchId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid event ID or match ID' 
    });
  }

  if (req.method === 'PUT') {
    try {
      const { result, reportedBy } = req.body as {
        result: MatchResult;
        reportedBy: string;
      };

      if (!result || typeof reportedBy !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Result and reportedBy are required',
        });
      }

      // Validate result structure
      if (
        typeof result.playerAWins !== 'number' ||
        typeof result.playerBWins !== 'number' ||
        typeof result.isDraw !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid result format',
        });
      }

      // Fetch current event
      const eventData = await kv.get(`event:${id}`);

      if (!eventData) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const event: EventSession = typeof eventData === 'string' 
        ? JSON.parse(eventData) 
        : eventData;

      // Find the match across all rounds
      let targetMatch: Match | null = null;
      let targetRoundIndex = -1;
      let targetMatchIndex = -1;

      for (let ri = 0; ri < event.rounds.length; ri++) {
        const round = event.rounds[ri];
        for (let mi = 0; mi < round.matches.length; mi++) {
          if (round.matches[mi].id === matchId) {
            targetMatch = round.matches[mi];
            targetRoundIndex = ri;
            targetMatchIndex = mi;
            break;
          }
        }
        if (targetMatch) break;
      }

      if (!targetMatch) {
        return res.status(404).json({
          success: false,
          message: 'Match not found',
        });
      }

      // Check if result already exists (race condition handling)
      if (targetMatch.result !== null) {
        return res.status(200).json({
          success: true,
          alreadyReported: true,
          result: targetMatch.result,
          reportedBy: targetMatch.reportedBy,
          reportedAt: targetMatch.reportedAt,
        });
      }

      // Verify the reporter is a participant in this match
      if (targetMatch.playerAId !== reportedBy && targetMatch.playerBId !== reportedBy) {
        return res.status(403).json({
          success: false,
          message: 'Only match participants can report results',
        });
      }

      // Update the match with the result
      const now = Date.now();
      event.rounds[targetRoundIndex].matches[targetMatchIndex] = {
        ...targetMatch,
        result,
        reportedBy,
        reportedAt: now,
      };
      event.updatedAt = now;

      // Save the updated event
      await kv.set(`event:${id}`, JSON.stringify(event), { ex: EVENT_TTL });

      // Also refresh the event code mapping TTL if it exists
      if (event.eventCode) {
        await kv.set(`eventCode:${event.eventCode}`, id, { ex: EVENT_TTL });
      }

      return res.status(200).json({
        success: true,
        alreadyReported: false,
        result,
        reportedBy,
        reportedAt: now,
      });
    } catch (error) {
      console.error('Error updating match result:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update match result',
      });
    }
  }

  // GET - Fetch match details
  if (req.method === 'GET') {
    try {
      const eventData = await kv.get(`event:${id}`);

      if (!eventData) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const event: EventSession = typeof eventData === 'string'
        ? JSON.parse(eventData)
        : eventData;

      // Find the match
      for (const round of event.rounds) {
        for (const match of round.matches) {
          if (match.id === matchId) {
            return res.status(200).json({
              success: true,
              match,
              roundNumber: round.roundNumber,
            });
          }
        }
      }

      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    } catch (error) {
      console.error('Error fetching match:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch match',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

