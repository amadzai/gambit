import { Trophy, TrendingUp } from "lucide-react";
import type { MarketplaceAgent } from "@/types/marketplace";

/**
 * Props for the marketplace leaderboard. Expects MarketplaceAgent[] from @/types/marketplace.
 */
export interface MarketplaceLeaderboardProps {
  /** List of agents (MarketplaceAgent from @/types/marketplace). Sorted by ELO in component. */
  agents: MarketplaceAgent[];
}

/**
 * Leaderboard table of agents by rank (ELO), win rate, matches. Uses MarketplaceAgent[].
 */
export function MarketplaceLeaderboard({
  agents,
}: MarketplaceLeaderboardProps) {
  const sortedAgents = [...agents].sort((a, b) => b.elo - a.elo);

  const getRankColor = (rank: number) => {
    if (rank === 0) return "text-yellow-400";
    if (rank === 1) return "text-slate-300";
    if (rank === 2) return "text-orange-400";
    return "text-slate-500";
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Rank
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Agent
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">
                Rating
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">
                Win Rate
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">
                Matches
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent, index) => {
              const winRate = (
                (agent.wins / (agent.wins + agent.losses + agent.draws)) *
                100
              ).toFixed(1);
              const totalMatches = agent.wins + agent.losses + agent.draws;

              return (
                <tr
                  key={agent.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {index < 3 ? (
                        <Trophy
                          className={`w-5 h-5 ${getRankColor(index)}`}
                        />
                      ) : (
                        <span className="text-slate-500 font-medium w-5 text-center">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{
                          background: `${agent.color}20`,
                          border: `2px solid ${agent.color}`,
                        }}
                      >
                        {agent.avatar}
                      </div>
                      <span className="font-medium text-white">
                        {agent.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-bold text-white">{agent.elo}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">
                        {winRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-slate-300">{totalMatches}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-bold text-violet-400">
                      ${agent.price.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
