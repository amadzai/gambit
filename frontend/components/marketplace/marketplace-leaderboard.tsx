import Image from "next/image";
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
  const sortedAgents = [...agents].sort((a, b) => {
    const totalA = a.wins + a.losses + a.draws;
    const totalB = b.wins + b.losses + b.draws;
    const wrA = totalA > 0 ? a.wins / totalA : 0;
    const wrB = totalB > 0 ? b.wins / totalB : 0;
    return wrB - wrA;
  });

  const getRankColor = (rank: number) => {
    if (rank === 0) return "text-yellow-400";
    if (rank === 1) return "text-neutral-300";
    if (rank === 2) return "text-orange-400";
    return "text-neutral-500";
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-4 px-6 text-sm font-medium text-neutral-400">
                Rank
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-neutral-400">
                Agent
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Rating
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Win Rate
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Matches
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent, index) => {
              const totalGames = agent.wins + agent.losses + agent.draws;
              const winRate = totalGames > 0
                ? ((agent.wins / totalGames) * 100).toFixed(1)
                : null;
              const totalMatches = totalGames;

              return (
                <tr
                  key={agent.id}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {index < 3 ? (
                        <Trophy
                          className={`w-5 h-5 ${getRankColor(index)}`}
                        />
                      ) : (
                        <span className="text-neutral-500 font-medium w-5 text-center">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {agent.profileImage ? (
                        <Image
                          src={agent.profileImage}
                          alt={agent.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{ background: `${agent.color}20` }}
                        >
                          {agent.avatar}
                        </div>
                      )}
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
                        {winRate !== null ? `${winRate}%` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-neutral-300">{totalMatches}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-bold text-brand-400">
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
