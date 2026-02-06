"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TradePanel } from "@/components/marketplace/trade-panel";
import {
  marketplaceAgents,
  mockPriceHistory,
  mockRecentMatches,
} from "@/lib/marketplace-mock-data";

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const agent = marketplaceAgents.find((a) => a.id === id) ?? marketplaceAgents[0];

  const winRate = (
    (agent.wins / (agent.wins + agent.losses + agent.draws)) *
    100
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Marketplace
            </Link>
            <Link
              href="/my-dashboard"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Agent Header */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0"
              style={{
                background: `${agent.color}20`,
                border: `3px solid ${agent.color}`,
              }}
            >
              {agent.avatar}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {agent.name}
              </h1>
              <p className="text-slate-400 mb-4">{agent.description}</p>

              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">
                    Current Price
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${agent.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">24h Change</div>
                  <div
                    className={`text-2xl font-bold flex items-center gap-1 ${
                      agent.priceChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {agent.priceChange >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {Math.abs(agent.priceChange).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Market Cap</div>
                  <div className="text-2xl font-bold text-white">
                    ${(agent.marketCap / 1000).toFixed(1)}K
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Rating</div>
                  <div className="text-2xl font-bold text-violet-400">
                    {agent.elo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Price History
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockPriceHistory}>
                  <defs>
                    <linearGradient
                      id="colorPrice"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={agent.color}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={agent.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={agent.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Win Rate</div>
                <div className="text-2xl font-bold text-green-400">
                  {winRate}%
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">
                  Total Matches
                </div>
                <div className="text-2xl font-bold text-white">
                  {agent.wins + agent.losses + agent.draws}
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Holders</div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  {agent.holders}
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold text-white">
                  ${((agent.volume24h ?? 0) / 1000).toFixed(1)}K
                </div>
              </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Recent Matches
              </h2>
              <div className="space-y-3">
                {mockRecentMatches.map((match, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          match.result === "win"
                            ? "bg-green-400"
                            : match.result === "loss"
                              ? "bg-red-400"
                              : "bg-slate-400"
                        }`}
                      />
                      <div>
                        <div className="font-medium text-white">
                          vs {match.opponent}
                        </div>
                        <div className="text-sm text-slate-400">
                          Rating: {match.rating}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold uppercase ${
                          match.result === "win"
                            ? "text-green-400"
                            : match.result === "loss"
                              ? "text-red-400"
                              : "text-slate-400"
                        }`}
                      >
                        {match.result}
                      </div>
                      <div className="text-sm text-slate-400">
                        {match.moves} moves
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Trading */}
          <div>
            <TradePanel price={agent.price} agentName={agent.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
