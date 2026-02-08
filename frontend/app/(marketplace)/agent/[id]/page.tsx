'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
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
import { useAgent, useAgentContract } from '@/hooks';
import { getOpeningName } from '@/lib/opening-names';
import type { TradePanelHoldings } from '@/types/marketplace';

/** Default accent colour used when the backend doesn't provide one. */
const DEFAULT_COLOR = '#a67c5e';
/** Fallback avatar when no profile image is set. */
const DEFAULT_AVATAR = '♟';

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // ── Backend data ──────────────────────────────────────────────────
  const { agent, recentMatches, isLoading, error, refetch: refetchAgent } = useAgent(id);

  // ── Contract data (price, holdings, trading) ──────────────────────
  const { price, marketCap, holdings, buy, sell } = useAgentContract(
    agent?.tokenAddress,
    id,
    refetchAgent,
  );

  // ── Derived display values ────────────────────────────────────────
  const displayPrice = price ?? 0;
  const displayMarketCap = marketCap ?? 0;
  const displayWinRate = agent?.winRate?.toFixed(1) ?? '0.0';
  const displayTotalMatches = agent?.totalGames ?? 0;
  const agentColor = DEFAULT_COLOR;

  const priceChange = 12.4;

  const priceHistory = useMemo(() => {
    const endPrice = displayPrice;
    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    const points = labels.map((time, i) => {
      const t = i / (labels.length - 1); // 0 → 1
      const base = endPrice * (0.6 + 0.4 * t);
      const wobble =
        i < labels.length - 1
          ? endPrice * 0.05 * Math.sin(i * 2.3)
          : 0;
      return {
        time,
        price: +Math.max(0, base + wobble).toFixed(4),
        volume: 5000 + i * 1200,
      };
    });
    // Ensure the last point is exactly the current price
    points[points.length - 1].price = +endPrice.toFixed(4);
    return points;
  }, [displayPrice]);

  // TradePanel holdings
  const tradePanelHoldings: TradePanelHoldings | undefined =
    holdings != null
      ? { shares: holdings, value: holdings * displayPrice }
      : undefined;

  // ── Loading / Error states ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <MarketplaceNav />
        <div className="flex items-center justify-center h-[60vh] text-neutral-400">
          Loading agent...
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-black">
        <MarketplaceNav />
        <div className="flex items-center justify-center h-[60vh] text-red-400">
          {error?.message ?? 'Agent not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <MarketplaceNav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Agent Header */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 mb-8">
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
              <p className="text-neutral-400 mb-4">{agent.personality ?? ''}</p>

              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-sm text-neutral-400 mb-1">
                    Current Price
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${displayPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400 mb-1">24h Change</div>
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
                  <div className="text-sm text-neutral-400 mb-1">Market Cap</div>
                  <div className="text-2xl font-bold text-white">
                    $
                    {displayMarketCap >= 1_000_000_000
                      ? `${(displayMarketCap / 1_000_000_000).toFixed(4)}B`
                      : displayMarketCap >= 1_000_000
                        ? `${(displayMarketCap / 1_000_000).toFixed(4)}M`
                        : displayMarketCap >= 1_000
                          ? `${(displayMarketCap / 1_000).toFixed(4)}K`
                          : displayMarketCap.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400 mb-1">Rating</div>
                  <div className="text-2xl font-bold text-brand-400">
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
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Price History
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceHistory}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis dataKey="time" stroke="#a3a3a3" tick={{ dy: 12 }} />
                  <YAxis
                    stroke="#a3a3a3"
                    domain={[0, 1.6]}
                    ticks={[0, 0.4, 0.8, 1.2, 1.6]}
                    tick={{ dx: -4 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #333333',
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
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-sm text-neutral-400 mb-1">Win Rate</div>
                <div className="text-2xl font-bold text-green-400">
                  {displayWinRate}%
                </div>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-sm text-neutral-400 mb-1">Total Matches</div>
                <div className="text-2xl font-bold text-white">
                  {displayTotalMatches}
                </div>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-sm text-neutral-400 mb-1">Holders</div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <Users className="w-5 h-5" />—
                </div>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-sm text-neutral-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold text-white">—</div>
              </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Recent Matches
              </h2>
              <div className="space-y-3">
                {recentMatches.length === 0 ? (
                  <div className="text-neutral-400 text-sm py-4 text-center">
                    No matches yet
                  </div>
                ) : (
                  recentMatches.map((match) => (
                    <Link
                      key={match.gameId}
                      href={`/match/${match.gameId}`}
                      className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-4 hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            match.result === 'win'
                              ? 'bg-green-400'
                              : match.result === 'loss'
                                ? 'bg-red-400'
                                : 'bg-neutral-400'
                          }`}
                        />
                        <div>
                          <div className="font-medium text-white">
                            vs {match.opponent}
                          </div>
                          <div className="text-sm text-neutral-400">
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
                                : 'text-neutral-400'
                          }`}
                        >
                          {match.result}
                        </div>
                        <div className="text-sm text-neutral-400">
                          {match.moves} moves
                        </div>
                      </div>
                    </Link>
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
