"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Settings, Plus } from "lucide-react";
import type { MyDashboardAgent } from "@/types/marketplace";

/**
 * Props for the my-agents grid. Expects MyDashboardAgent[] from @/types/marketplace.
 */
export interface MyAgentsGridProps {
  /** List of agents owned or managed by the user (MyDashboardAgent from @/types/marketplace). */
  agents: MyDashboardAgent[];
}

/**
 * Grid of agent cards for "my dashboard" (price, win rate, links to agent page and settings). Uses MyDashboardAgent[].
 */
export function MyAgentsGrid({ agents }: MyAgentsGridProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const winRate = (
            (agent.wins / (agent.wins + agent.losses + agent.draws)) *
            100
          ).toFixed(1);
          const totalMatches = agent.wins + agent.losses + agent.draws;

          return (
            <div
              key={agent.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-violet-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: `${agent.color}20`,
                      border: `2px solid ${agent.color}`,
                    }}
                  >
                    {agent.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {agent.name}
                    </h3>
                    <div className="text-sm text-slate-400">
                      Rating: {agent.rating}
                    </div>
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

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Price</div>
                  <div className="font-bold text-violet-400">
                    ${agent.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Market Cap</div>
                  <div className="font-semibold text-white">
                    ${(agent.marketCap / 1000).toFixed(1)}K
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Holders</div>
                  <div className="font-semibold text-white">
                    {agent.holders}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 mb-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                  <div className="font-semibold text-white">{winRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Matches</div>
                  <div className="font-semibold text-white">{totalMatches}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">W/L/D</div>
                  <div className="text-xs text-white">
                    <span className="text-green-400">{agent.wins}</span>/
                    <span className="text-red-400">{agent.losses}</span>/
                    <span className="text-slate-400">{agent.draws}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/agent/${agent.id}`}
                  className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-colors text-center"
                >
                  View Details
                </Link>
                <button className="px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                Created: {new Date(agent.created).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
