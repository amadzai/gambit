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
import type { PortfolioPosition, MyDashboardAgent } from '@/types/marketplace';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseMyDashboardResult {
  /** Portfolio positions built from backend agents (first 4). */
  positions: PortfolioPosition[];
  /** User's agents built from backend agents (first 2). */
  myAgents: MyDashboardAgent[];
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
    hash |= 0;
  }
  return ((hash >>> 0) % 10000) / 10000;
}

// Pre-set mock financials so the 4 positions total ≈ $200 value / ≈ $60 PnL.
const MOCK_POSITIONS = [
  { shares: 12.5, currentPrice: 4.2, avgPrice: 3.0 },
  { shares: 8.3, currentPrice: 6.5, avgPrice: 4.8 },
  { shares: 15.0, currentPrice: 3.2, avgPrice: 2.1 },
  { shares: 10.2, currentPrice: 4.5, avgPrice: 3.0 },
];

/**
 * Build a PortfolioPosition from a backend Agent.
 * Financial values are hardcoded mocks targeting ~$200 total / ~$60 PnL.
 */
function buildPosition(
  agent: Agent,
  index: number,
): PortfolioPosition {
  const mock = MOCK_POSITIONS[index % MOCK_POSITIONS.length];
  const value = +(mock.shares * mock.currentPrice).toFixed(2);
  const pnl = +(mock.shares * (mock.currentPrice - mock.avgPrice)).toFixed(2);
  const pnlPercent = +(
    ((mock.currentPrice - mock.avgPrice) / mock.avgPrice) *
    100
  ).toFixed(1);

  return {
    agentId: agent.id,
    agentName: agent.name,
    avatar: AVATARS[index % AVATARS.length],
    profileImage: agent.profileImage,
    shares: mock.shares,
    avgPrice: mock.avgPrice,
    currentPrice: mock.currentPrice,
    value,
    pnl,
    pnlPercent,
    color: COLORS[index % COLORS.length],
  };
}

/**
 * Build a MyDashboardAgent from a backend Agent + Uniswap price data.
 */
function buildMyAgent(
  agent: Agent,
  index: number,
  price: number,
  marketCap: number,
): MyDashboardAgent {
  const rng = seededRandom(agent.id);
  const priceChange = Math.round((rng * 60 - 20) * 10) / 10;
  const holders = Math.floor(seededRandom(agent.id + '_h') * 110 + 10);

  return {
    id: agent.id,
    name: agent.name,
    avatar: AVATARS[index % AVATARS.length],
    profileImage: agent.profileImage,
    rating: agent.elo,
    wins: agent.wins ?? 0,
    losses: agent.losses ?? 0,
    draws: agent.draws ?? 0,
    price,
    priceChange,
    marketCap,
    holders,
    color: COLORS[index % COLORS.length],
    status: 'active',
    created: agent.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMyDashboard(): UseMyDashboardResult {
  const config = useConfig();

  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [myAgents, setMyAgents] = useState<MyDashboardAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch all agents from the backend
      const agents = await apiService.agent.list();

      // 2. Batch-read Uniswap prices for agents with token addresses
      const addresses = getUniswapAddresses();
      const priceMap = new Map<string, number>();
      const mcapMap = new Map<string, number>();

      const agentsWithTokens = agents.filter(
        (a) => a.tokenAddress && a.tokenAddress !== '0x',
      );

      if (agentsWithTokens.length > 0 && addresses.stateView) {
        const contracts = agentsWithTokens.map((agent) => {
          const tokenAddr = agent.tokenAddress as `0x${string}`;
          const poolKey = getPoolKey(
            tokenAddr,
            addresses.usdc,
            HOOKLESS_HOOKS,
          );
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
              const sqrtPriceX96 = (
                result.result as readonly unknown[]
              )[0] as bigint;
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
          console.warn('Failed to batch-read Uniswap prices');
        }
      }

      // 3. Build portfolio positions from the first 4 agents
      const positionAgents = agents.slice(0, 4);
      const builtPositions = positionAgents.map((agent, i) =>
        buildPosition(agent, i),
      );
      setPositions(builtPositions);

      // 4. Build "my agents" from the first 2 agents
      const myAgentsList = agents.slice(0, 2);
      const builtAgents = myAgentsList.map((agent, i) =>
        buildMyAgent(
          agent,
          i,
          priceMap.get(agent.id) ?? 0,
          mcapMap.get(agent.id) ?? 0,
        ),
      );
      setMyAgents(builtAgents);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { positions, myAgents, isLoading, error };
}
