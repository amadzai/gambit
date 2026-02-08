'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Users, Trophy } from 'lucide-react';
import { MarketplaceNav } from '@/components/marketplace/marketplace-nav';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TradePanel } from '@/components/marketplace/trade-panel';
import { mockPriceHistory } from '@/lib/marketplace-mock-data';
import { useAgent, useAgentContract } from '@/hooks';
import { getOpeningName } from '@/lib/opening-names';
import type { TradePanelHoldings } from '@/types/marketplace';

/** Default accent colour used when the backend doesn't provide one. */
const DEFAULT_COLOR = '#8B5CF6';
/** Fallback avatar when no profile image is set. */
const DEFAULT_AVATAR = '♟';

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // ── Backend data ──────────────────────────────────────────────────
  const { agent, recentMatches, isLoading, error } = useAgent(id);

  // ── Contract data (price, holdings, trading) ──────────────────────
  const { price, marketCap, holdings, buy, sell } = useAgentContract(
    agent?.tokenAddress,
  );

  // ── Derived display values ────────────────────────────────────────
  const displayPrice = price ?? 0;
  const displayMarketCap = marketCap ?? 0;
  const displayWinRate = agent?.winRate?.toFixed(1) ?? '0.0';
  const displayTotalMatches = agent?.totalGames ?? 0;
  const agentColor = DEFAULT_COLOR;

  // Placeholder for 24h change (would need historical indexing)
  const priceChange = 0;

  // TradePanel holdings
  const tradePanelHoldings: TradePanelHoldings | undefined =
    holdings != null
      ? { shares: holdings, value: holdings * displayPrice }
      : undefined;

  // ── Loading / Error states ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <MarketplaceNav />
        <div className="flex items-center justify-center h-[60vh] text-slate-400">
          Loading agent...
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <MarketplaceNav />
        <div className="flex items-center justify-center h-[60vh] text-red-400">
          {error?.message ?? 'Agent not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <MarketplaceNav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Agent Header */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0">
              {agent.profileImage ? (
                <Image
                  src={agent.profileImage}
                  alt={agent.name}
                  width={96}
                  height={96}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                DEFAULT_AVATAR
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {agent.name}
              </h1>
              <h2 className="text-lg text-white mb-2">
                {getOpeningName(agent.opening ?? undefined)}
              </h2>
              <p className="text-slate-400 mb-4">{agent.personality ?? ''}</p>

              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">
                    Current Price
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${displayPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">24h Change</div>
                  <div
                    className={`text-2xl font-bold flex items-center gap-1 ${
                      priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {priceChange >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {Math.abs(priceChange).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Market Cap</div>
                  <div className="text-2xl font-bold text-white">
                    $
                    {displayMarketCap >= 1000
                      ? `${(displayMarketCap / 1000).toFixed(1)}K`
                      : displayMarketCap.toFixed(1)}
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
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={agentColor}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={agentColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={agentColor}
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
                  {displayWinRate}%
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Total Matches</div>
                <div className="text-2xl font-bold text-white">
                  {displayTotalMatches}
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Holders</div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <Users className="w-5 h-5" />—
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold text-white">—</div>
              </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Recent Matches
              </h2>
              <div className="space-y-3">
                {recentMatches.length === 0 ? (
                  <div className="text-slate-400 text-sm py-4 text-center">
                    No matches yet
                  </div>
                ) : (
                  recentMatches.map((match) => (
                    <div
                      key={match.gameId}
                      className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            match.result === 'win'
                              ? 'bg-green-400'
                              : match.result === 'loss'
                                ? 'bg-red-400'
                                : 'bg-slate-400'
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
                            match.result === 'win'
                              ? 'text-green-400'
                              : match.result === 'loss'
                                ? 'text-red-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {match.result}
                        </div>
                        <div className="text-sm text-slate-400">
                          {match.moves} moves
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Trading */}
          <div>
            <TradePanel
              price={displayPrice}
              agentName={agent.name}
              holdings={tradePanelHoldings}
              onBuy={buy}
              onSell={sell}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
