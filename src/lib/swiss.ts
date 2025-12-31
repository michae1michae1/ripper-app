import type { Player, Round, PlayerStanding } from '@/types/event';
import { MATCH_POINTS } from './constants';

interface PlayerScore {
  playerId: string;
  points: number;
  opponentIds: string[];
  hadBye: boolean;
}

function calculatePlayerScores(
  players: Player[],
  rounds: Round[]
): Map<string, PlayerScore> {
  const scores = new Map<string, PlayerScore>();
  
  // Initialize all players
  for (const player of players) {
    scores.set(player.id, {
      playerId: player.id,
      points: 0,
      opponentIds: [],
      hadBye: false,
    });
  }
  
  // Process all rounds
  for (const round of rounds) {
    for (const match of round.matches) {
      const playerA = scores.get(match.playerAId);
      if (!playerA) continue;
      
      // Handle bye
      if (match.playerBId === null) {
        playerA.points += MATCH_POINTS.WIN;
        playerA.hadBye = true;
        continue;
      }
      
      const playerB = scores.get(match.playerBId);
      if (!playerB) continue;
      
      // Track opponents
      playerA.opponentIds.push(match.playerBId);
      playerB.opponentIds.push(match.playerAId);
      
      // Calculate points from result
      if (match.result) {
        if (match.result.isDraw) {
          playerA.points += MATCH_POINTS.DRAW;
          playerB.points += MATCH_POINTS.DRAW;
        } else if (match.result.playerAWins > match.result.playerBWins) {
          playerA.points += MATCH_POINTS.WIN;
          playerB.points += MATCH_POINTS.LOSS;
        } else {
          playerA.points += MATCH_POINTS.LOSS;
          playerB.points += MATCH_POINTS.WIN;
        }
      }
    }
  }
  
  return scores;
}

function havePlayed(
  playerAId: string,
  playerBId: string,
  scores: Map<string, PlayerScore>
): boolean {
  const playerA = scores.get(playerAId);
  return playerA?.opponentIds.includes(playerBId) ?? false;
}

export function generateSwissPairings(
  players: Player[],
  previousRounds: Round[]
): [string, string | null][] {
  const scores = calculatePlayerScores(players, previousRounds);
  const pairings: [string, string | null][] = [];
  const paired = new Set<string>();
  
  // Sort players by points (descending), then by seat number for tiebreaker
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores.get(a.id)?.points ?? 0;
    const scoreB = scores.get(b.id)?.points ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.seatNumber - b.seatNumber;
  });
  
  // Handle bye first if odd number of players
  if (sortedPlayers.length % 2 === 1) {
    // Find lowest-ranked player who hasn't had a bye
    for (let i = sortedPlayers.length - 1; i >= 0; i--) {
      const player = sortedPlayers[i];
      const score = scores.get(player.id);
      if (!score?.hadBye) {
        pairings.push([player.id, null]);
        paired.add(player.id);
        break;
      }
    }
    
    // If everyone has had a bye, give it to the lowest ranked
    if (paired.size === 0) {
      const lastPlayer = sortedPlayers[sortedPlayers.length - 1];
      pairings.push([lastPlayer.id, null]);
      paired.add(lastPlayer.id);
    }
  }
  
  // Pair remaining players
  for (const playerA of sortedPlayers) {
    if (paired.has(playerA.id)) continue;
    
    // Find best opponent for this player
    for (const playerB of sortedPlayers) {
      if (playerB.id === playerA.id) continue;
      if (paired.has(playerB.id)) continue;
      if (havePlayed(playerA.id, playerB.id, scores)) continue;
      
      // Found a valid pairing
      pairings.push([playerA.id, playerB.id]);
      paired.add(playerA.id);
      paired.add(playerB.id);
      break;
    }
  }
  
  // If we couldn't avoid repeat pairings, just pair whoever is left
  const unpaired = sortedPlayers.filter(p => !paired.has(p.id));
  for (let i = 0; i < unpaired.length; i += 2) {
    if (i + 1 < unpaired.length) {
      pairings.push([unpaired[i].id, unpaired[i + 1].id]);
    }
  }
  
  return pairings;
}

export function calculateStandings(
  players: Player[],
  rounds: Round[]
): PlayerStanding[] {
  const scores = calculatePlayerScores(players, rounds);
  const standings: PlayerStanding[] = [];
  
  for (const player of players) {
    const score = scores.get(player.id);
    if (!score) continue;
    
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let gameWins = 0;
    let gameLosses = 0;
    
    // Count match results
    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.playerAId !== player.id && match.playerBId !== player.id) continue;
        if (!match.result) continue;
        
        const isPlayerA = match.playerAId === player.id;
        
        // Handle bye
        if (match.playerBId === null) {
          wins++;
          gameWins += 2;
          continue;
        }
        
        if (match.result.isDraw) {
          draws++;
          gameWins += match.result.playerAWins;
          gameLosses += match.result.playerBWins;
        } else {
          const playerWins = isPlayerA ? match.result.playerAWins : match.result.playerBWins;
          const playerLosses = isPlayerA ? match.result.playerBWins : match.result.playerAWins;
          
          gameWins += playerWins;
          gameLosses += playerLosses;
          
          if (playerWins > playerLosses) {
            wins++;
          } else {
            losses++;
          }
        }
      }
    }
    
    // Calculate opponent match win percentage
    let totalOpponentWinPct = 0;
    for (const opponentId of score.opponentIds) {
      const opponentScore = scores.get(opponentId);
      if (!opponentScore) continue;
      
      const opponentMatches = opponentScore.opponentIds.length + (opponentScore.hadBye ? 1 : 0);
      if (opponentMatches === 0) continue;
      
      const opponentWinPct = opponentScore.points / (opponentMatches * 3);
      // Minimum 33% per DCI rules
      totalOpponentWinPct += Math.max(0.33, opponentWinPct);
    }
    
    const opponentMatchWinPercentage = score.opponentIds.length > 0
      ? (totalOpponentWinPct / score.opponentIds.length) * 100
      : 0;
    
    // Calculate game win percentage
    const totalGames = gameWins + gameLosses;
    const gameWinPercentage = totalGames > 0
      ? (gameWins / totalGames) * 100
      : 0;
    
    // Calculate opponent game win percentage (simplified)
    const opponentGameWinPercentage = opponentMatchWinPercentage;
    
    standings.push({
      playerId: player.id,
      points: score.points,
      wins,
      losses,
      draws,
      opponentMatchWinPercentage,
      gameWinPercentage,
      opponentGameWinPercentage,
    });
  }
  
  // Sort by points, then OMW%, then GW%
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.opponentMatchWinPercentage !== a.opponentMatchWinPercentage) {
      return b.opponentMatchWinPercentage - a.opponentMatchWinPercentage;
    }
    return b.gameWinPercentage - a.gameWinPercentage;
  });
  
  return standings;
}

