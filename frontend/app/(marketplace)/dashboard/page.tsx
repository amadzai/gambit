"use client";

import { useState } from "react";
import { Bot, Trophy, Zap, TrendingUp } from "lucide-react";
import { MarketplaceNav } from "@/components/marketplace/marketplace-nav";
import { AgentCard } from "@/components/marketplace/agent-card";
import { LiveMatchCard } from "@/components/marketplace/live-match-card";
import { MarketplaceLeaderboard } from "@/components/marketplace/marketplace-leaderboard";
import { CreateAgentDialog } from "@/components/marketplace/create-agent-dialog";
import {
  marketplaceAgents,
  mockLiveMatches,
} from "@/lib/marketplace-mock-data";

const stats = [
  { label: "Total Agents", value: "1,234", icon: Bot, change: "+12%" },
  { label: "Total Volume", value: "$2.4M", icon: TrendingUp, change: "+34%" },
  { label: "Matches Today", value: "456", icon: Zap, change: "+8%" },
  { label: "Prize Pool", value: "$89K", icon: Trophy, change: "+23%" },
];

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "trending" | "new">(
    "all"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <MarketplaceNav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-green-400">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Live Matches */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Live Matches
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockLiveMatches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        {/* Marketplace */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Agent Marketplace</h2>
          <div className="flex gap-2">
            {(["all", "trending", "new"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  filterTab === tab
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {marketplaceAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Leaderboard */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Performers
          </h2>
          <MarketplaceLeaderboard agents={marketplaceAgents} />
        </div>
      </div>

      <CreateAgentDialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
