"use client";

import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { MarketplaceAgent } from "@/types/marketplace";

function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(4) + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(4) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(4) + 'K';
  return value.toFixed(4);
}

/**
 * Props for the marketplace agent card. Expects MarketplaceAgent from @/types/marketplace.
 */
export interface AgentCardProps {
  /** Agent data (MarketplaceAgent from @/types/marketplace). */
  agent: MarketplaceAgent;
}

/**
 * Card showing agent summary, performance chart, price, win rate; links to agent page. Used on marketplace dashboard.
 */
export function AgentCard({ agent }: AgentCardProps) {
  const chartData = agent.performance.map((value, index) => ({
    index,
    value,
  }));

  const totalGames = agent.wins + agent.losses + agent.draws;
  const winRate = totalGames > 0
    ? ((agent.wins / totalGames) * 100).toFixed(1)
    : null;

  return (
    <Link href={`/agent/${agent.id}`}>
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-brand-500/50 transition-all hover:shadow-lg hover:shadow-brand-500/10 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {agent.profileImage ? (
              <Image
                src={agent.profileImage}
                alt={agent.name}
                width={70}
                height={70}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: `${agent.color}20`,
                  border: `2px solid ${agent.color}`,
                }}
              >
                {agent.avatar}
              </div>
            )}
            <div>
              <h3 className="font-bold text-white group-hover:text-brand-400 transition-colors">
                {agent.name}
              </h3>
              <div className="text-sm text-neutral-400">Rating: {agent.elo}</div>
            </div>
          </div>
        </div>

        <div className="mb-4 -mx-2">
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={agent.color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-white">
              ${agent.price.toFixed(2)}
            </div>
            <div className="text-sm text-neutral-400">
              MCap: ${formatMarketCap(agent.marketCap)}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 ${
              agent.priceChange >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {agent.priceChange >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">
              {Math.abs(agent.priceChange).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-800">
          <div>
            <div className="text-xs text-neutral-400 mb-1">Win Rate</div>
            <div className="font-semibold text-white">{winRate !== null ? `${winRate}%` : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">Matches</div>
            <div className="font-semibold text-white">
              {agent.wins + agent.losses + agent.draws}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">W/L/D</div>
            <div className="text-sm text-white">
              <span className="text-green-400">{agent.wins}</span>/
              <span className="text-red-400">{agent.losses}</span>/
              <span className="text-neutral-400">{agent.draws}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">Holders</div>
            <div className="font-semibold text-white">
              {agent.holders ?? Math.floor(agent.marketCap / agent.price / 100)}
            </div>
          </div>
        </div>

        <button className="w-full mt-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white py-2.5 rounded-lg font-medium hover:from-brand-700 hover:to-brand-600 transition-all">
          Trade
        </button>
      </div>
    </Link>
  );
}
