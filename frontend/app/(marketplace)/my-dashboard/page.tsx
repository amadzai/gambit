"use client";

import { useState } from "react";
import { Wallet, BarChart3, Users, Settings } from "lucide-react";
import { MarketplaceNav } from "@/components/marketplace/marketplace-nav";
import { PortfolioChart } from "@/components/marketplace/portfolio-chart";
import { PositionsTable } from "@/components/marketplace/positions-table";
import { MyAgentsGrid } from "@/components/marketplace/my-agents-grid";
import {
  mockPortfolio,
  mockPortfolioHistory,
  mockMyAgents,
} from "@/lib/marketplace-mock-data";

export default function MyDashboardPage() {
  const [activeTab, setActiveTab] = useState<"portfolio" | "agents">(
    "portfolio"
  );

  const totalValue = mockPortfolio.reduce((sum, p) => sum + p.value, 0);
  const totalPnL = mockPortfolio.reduce((sum, p) => sum + p.pnl, 0);
  const totalChangePercent = totalPnL > 0 ? ((totalPnL / (totalValue - totalPnL)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <MarketplaceNav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">My Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-slate-400" />
                <span
                  className={`text-sm ${
                    totalChangePercent >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {totalChangePercent >= 0 ? "+" : ""}
                  {totalChangePercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                ${totalValue.toFixed(2)}
              </div>
              <div className="text-sm text-slate-400">
                Total Portfolio Value
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                <span
                  className={`text-sm ${
                    totalPnL >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
                </span>
              </div>
              <div
                className={`text-3xl font-bold ${
                  totalPnL >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                ${totalPnL.toFixed(2)}
              </div>
              <div className="text-sm text-slate-400">Total P&L</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {mockPortfolio.length}
              </div>
              <div className="text-sm text-slate-400">Active Positions</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Settings className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {mockMyAgents.length}
              </div>
              <div className="text-sm text-slate-400">Created Agents</div>
            </div>
          </div>

          {/* Portfolio Chart */}
          <div className="mb-8">
            <PortfolioChart data={mockPortfolioHistory} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "portfolio"
                ? "bg-violet-600 text-white"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Token Positions
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "agents"
                ? "bg-violet-600 text-white"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
            }`}
          >
            My Agents
          </button>
        </div>

        {/* Content */}
        {activeTab === "portfolio" ? (
          <PositionsTable positions={mockPortfolio} />
        ) : (
          <MyAgentsGrid agents={mockMyAgents} />
        )}
      </div>
    </div>
  );
}
