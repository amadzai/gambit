'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConfig } from 'wagmi';
import { readContracts } from 'wagmi/actions';
import { baseSepolia } from 'wagmi/chains';
import { apiService } from '@/utils/apiService';
import { stateViewAbi } from '@/lib/contracts/abis';
import {
  getUniswapAddresses,
  getPoolKey,
  computePoolId,
  getAgentTokenPrice,
  AGENT_TOKEN_TOTAL_SUPPLY,
  HOOKLESS_HOOKS,
} from '@/lib/contracts/uniswap';
import type { Agent } from '@/types/agent';
import type { ChessGame } from '@/types/chess';
import type { MarketplaceAgent, LiveMatchData } from '@/types/marketplace';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseDashboardResult {
  /** All agents transformed into MarketplaceAgent shape. */
  marketplaceAgents: MarketplaceAgent[];
  /** Up to 2 live/recent matches for the dashboard hero section. */
  liveMatches: LiveMatchData[];
  /** True while the initial data is loading. */
  isLoading: boolean;
  /** Error from API calls, if any. */
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATARS = ['♔', '♜', '♕', '♖', '♘', '♛', '♗', '♚'];
const COLORS = [
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#06B6D4',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#A855F7',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple deterministic hash from a string → number in [0, 1). */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  // Map to [0, 1)
  return (((hash >>> 0) % 10000) / 10000);
}

/** Count full moves from a PGN string. */
function countMovesFromPgn(pgn: string): number {
  if (!pgn || !pgn.trim()) return 0;
  const tokens = pgn
    .replace(/\d+\./g, '')
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return Math.ceil(tokens.length / 2);
}

/**
 * Build a MarketplaceAgent from a backend Agent, Uniswap price data,
 * and deterministic faked values.
 */
function buildMarketplaceAgent(
  agent: Agent,
  index: number,
  price: number,
  marketCap: number,
): MarketplaceAgent {
  const rng = seededRandom(agent.id);
  // priceChange: random in [-20, 40]
  const priceChange = Math.round((rng * 60 - 20) * 10) / 10;
  // holders: random in [10, 120]
  const holders = Math.floor(seededRandom(agent.id + '_h') * 110 + 10);

  // Synthetic performance data (6 points)
  const performance = Array.from({ length: 6 }, (_, j) => {
    const t = j / 5;
    const wobble = Math.sin(j + index) * price * 0.15;
    return +(price * (0.7 + 0.3 * t) + wobble).toFixed(4);
  });

  return {
    // ChessAgent fields
    id: agent.id,
    name: agent.name,
    personality: agent.personality ?? '',
    playstyle: (agent.playstyle?.charAt(0) +
      agent.playstyle?.slice(1).toLowerCase()) as MarketplaceAgent['playstyle'],
    firstMove: (agent.opening ?? 'e4') as MarketplaceAgent['firstMove'],
    marketCap,
    elo: agent.elo,
    wins: agent.wins ?? 0,
    losses: agent.losses ?? 0,
    draws: agent.draws ?? 0,
    owner: agent.creator ?? '',
    createdAt: new Date(agent.createdAt),
    // MarketplaceAgent extensions
    avatar: AVATARS[index % AVATARS.length],
    profileImage: agent.profileImage,
    price,
    priceChange,
    performance,
    color: COLORS[index % COLORS.length],
    description: agent.personality ?? undefined,
    holders,
    volume24h: 0,
  };
}

/**
 * Pick up to 2 games for the "Live Matches" section.
 * Priority: ACTIVE games first (newest), then most recent completed.
 * Active games are placed before completed ones.
 */
function selectLiveGames(
  activeGames: ChessGame[],
  recentGames: ChessGame[],
): ChessGame[] {
  const selected: ChessGame[] = [];

  // Add active games first (up to 2)
  for (const g of activeGames) {
    if (selected.length >= 2) break;
    selected.push(g);
  }

  // Backfill with recent completed games (avoid duplicates)
  if (selected.length < 2) {
    const selectedIds = new Set(selected.map((g) => g.id));
    for (const g of recentGames) {
      if (selected.length >= 2) break;
      if (!selectedIds.has(g.id)) {
        selected.push(g);
      }
    }
  }

  return selected;
}

/**
 * Build a LiveMatchData from a ChessGame and agent lookup map.
 */
function buildLiveMatch(
  game: ChessGame,
  agentMap: Map<string, Agent>,
  index: number,
): LiveMatchData {
  const whiteAgent = agentMap.get(game.whiteAgentId);
  const blackAgent = agentMap.get(game.blackAgentId);

  return {
    id: game.id,
    white: {
      id: game.whiteAgentId,
      name: whiteAgent?.name ?? 'Unknown',
      avatar: AVATARS[index * 2 % AVATARS.length],
      profileImage: whiteAgent?.profileImage,
      rating: whiteAgent?.elo ?? 1000,
      color: COLORS[index * 2 % COLORS.length],
    },
    black: {
      id: game.blackAgentId,
      name: blackAgent?.name ?? 'Unknown',
      avatar: AVATARS[(index * 2 + 1) % AVATARS.length],
      profileImage: blackAgent?.profileImage,
      rating: blackAgent?.elo ?? 1000,
      color: COLORS[(index * 2 + 1) % COLORS.length],
    },
    position: game.fen,
    move: countMovesFromPgn(game.pgn),
    status: 'live', // Always show as "live" per requirements
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboard(): UseDashboardResult {
  const config = useConfig();

  const [marketplaceAgents, setMarketplaceAgents] = useState<
    MarketplaceAgent[]
  >([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch agents, active games, and recent games in parallel
      const [agents, activeGames, recentGames] = await Promise.all([
        apiService.agent.list(),
        apiService.chess.getGames({ status: 'ACTIVE', take: 2 }),
        apiService.chess.getGames({ take: 2 }),
      ]);

      // 2. Build agent lookup map
      const agentMap = new Map<string, Agent>();
      for (const a of agents) {
        agentMap.set(a.id, a);
      }

      // 3. Batch-read Uniswap prices for agents with token addresses
      const addresses = getUniswapAddresses();
      const priceMap = new Map<string, number>(); // agentId → price
      const mcapMap = new Map<string, number>(); // agentId → marketCap

      const agentsWithTokens = agents.filter(
        (a) => a.tokenAddress && a.tokenAddress !== '0x',
      );

      if (agentsWithTokens.length > 0 && addresses.stateView) {
        // Build contract calls
        const contracts = agentsWithTokens.map((agent) => {
          const tokenAddr = agent.tokenAddress as `0x${string}`;
          const poolKey = getPoolKey(tokenAddr, addresses.usdc, HOOKLESS_HOOKS);
          const poolId = computePoolId(poolKey);
          return {
            address: addresses.stateView,
            abi: stateViewAbi,
            functionName: 'getSlot0' as const,
            args: [poolId] as const,
            chainId: baseSepolia.id,
          };
        });

        try {
          const results = await readContracts(config, { contracts });

          for (let i = 0; i < agentsWithTokens.length; i++) {
            const result = results[i];
            if (result.status === 'success' && result.result) {
              const sqrtPriceX96 = (result.result as readonly unknown[])[0] as bigint;
              if (sqrtPriceX96 > BigInt(0)) {
                const tokenAddr = agentsWithTokens[i]
                  .tokenAddress as `0x${string}`;
                const agentPrice = getAgentTokenPrice(
                  sqrtPriceX96,
                  tokenAddr,
                  addresses.usdc,
                );
                priceMap.set(agentsWithTokens[i].id, agentPrice);
                mcapMap.set(
                  agentsWithTokens[i].id,
                  agentPrice * AGENT_TOKEN_TOTAL_SUPPLY,
                );
              }
            }
          }
        } catch {
          // Uniswap reads failed — prices will be 0
          console.warn('Failed to batch-read Uniswap prices');
        }
      }

      // 4. Build MarketplaceAgent list
      const mktAgents = agents.map((agent, i) =>
        buildMarketplaceAgent(
          agent,
          i,
          priceMap.get(agent.id) ?? 0,
          mcapMap.get(agent.id) ?? 0,
        ),
      );
      setMarketplaceAgents(mktAgents);

      // 5. Build LiveMatchData list
      const selectedGames = selectLiveGames(activeGames, recentGames);
      const matches = selectedGames.map((game, i) =>
        buildLiveMatch(game, agentMap, i),
      );
      setLiveMatches(matches);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { marketplaceAgents, liveMatches, isLoading, error };
}
