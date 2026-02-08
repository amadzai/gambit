'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/utils/apiService';
import type { Agent } from '@/types/agent';
import type { ChessGame } from '@/types/chess';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A single entry in the agent's recent match list. */
export interface AgentRecentMatch {
  /** Game ID (can be used for linking). */
  gameId: string;
  /** Opponent display name. */
  opponent: string;
  /** Opponent ELO at time of query. */
  rating: number;
  /** Result relative to *this* agent. */
  result: 'win' | 'loss' | 'draw';
  /** Approximate number of half-moves converted to full moves. */
  moves: number;
}

export interface UseAgentResult {
  /** Agent profile data from the backend. */
  agent: Agent | null;
  /** Recent completed games for this agent (up to 10). */
  recentMatches: AgentRecentMatch[];
  /** True while the initial data is loading. */
  isLoading: boolean;
  /** Error from API calls, if any. */
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Count full moves from a PGN string (rough: split SAN tokens / 2).
 */
function countMovesFromPgn(pgn: string): number {
  if (!pgn || !pgn.trim()) return 0;
  // Remove move numbers and result markers, count SAN tokens
  const tokens = pgn
    .replace(/\d+\./g, '')
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return Math.ceil(tokens.length / 2);
}

/**
 * Determine the result of a completed game relative to the given agent.
 */
function resolveResult(
  game: ChessGame,
  agentId: string,
): 'win' | 'loss' | 'draw' | null {
  if (!game.winner) return null;
  if (game.winner === 'DRAW') return 'draw';

  const agentIsWhite = game.whiteAgentId === agentId;
  const whiteWon = game.winner === 'WHITE';

  if (agentIsWhite) return whiteWon ? 'win' : 'loss';
  return whiteWon ? 'loss' : 'win';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAgent(agentId: string | null): UseAgentResult {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [recentMatches, setRecentMatches] = useState<AgentRecentMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!agentId) {
      setAgent(null);
      setRecentMatches([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch agent profile and recent games in parallel
        const [agentData, games] = await Promise.all([
          apiService.agent.getById(agentId),
          apiService.chess.getGames({ agentId, take: 10 }),
        ]);
        if (cancelled) return;

        setAgent(agentData);

        // 2. Filter to completed games only
        const completedGames = games.filter(
          (g) => g.status !== 'ACTIVE',
        );

        // 3. Collect unique opponent IDs
        const opponentIds = new Set<string>();
        for (const game of completedGames) {
          const oppId =
            game.whiteAgentId === agentId
              ? game.blackAgentId
              : game.whiteAgentId;
          opponentIds.add(oppId);
        }

        // 4. Batch-fetch opponent agents
        const opponentMap = new Map<string, Agent>();
        const opponentFetches = Array.from(opponentIds).map(async (id) => {
          try {
            const opp = await apiService.agent.getById(id);
            opponentMap.set(id, opp);
          } catch {
            // Opponent may have been deleted; we'll use a fallback name
          }
        });
        await Promise.all(opponentFetches);
        if (cancelled) return;

        // 5. Build recent matches
        const matches: AgentRecentMatch[] = completedGames.map((game) => {
          const oppId =
            game.whiteAgentId === agentId
              ? game.blackAgentId
              : game.whiteAgentId;
          const opponent = opponentMap.get(oppId);
          const result = resolveResult(game, agentId);

          return {
            gameId: game.id,
            opponent: opponent?.name ?? 'Unknown',
            rating: opponent?.elo ?? 0,
            result: result ?? 'draw',
            moves: countMovesFromPgn(game.pgn),
          };
        });

        setRecentMatches(matches);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  return { agent, recentMatches, isLoading, error };
}
