"use client";

import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PortfolioPosition } from "@/types/marketplace";

/**
 * Props for the positions table. Expects PortfolioPosition[] from @/types/marketplace.
 */
export interface PositionsTableProps {
  /** User positions (PortfolioPosition from @/types/marketplace). */
  positions: PortfolioPosition[];
}

/**
 * Table of user portfolio positions (agent, shares, prices, P&L). Uses PortfolioPosition[].
 */
export function PositionsTable({ positions }: PositionsTableProps) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-4 px-6 text-sm font-medium text-neutral-400">
                Agent
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Shares
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Avg Price
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Current Price
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Value
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                P&L
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr
                key={position.agentId}
                className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
              >
                <td className="py-4 px-6">
                  <Link
                    href={`/agent/${position.agentId}`}
                    className="flex items-center gap-3 hover:text-brand-400 transition-colors"
                  >
                    {position.profileImage ? (
                      <Image
                        src={position.profileImage}
                        alt={position.agentName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{
                          background: `${position.color}20`,
                          border: `2px solid ${position.color}`,
                        }}
                      >
                        {position.avatar}
                      </div>
                    )}
                    <span className="font-medium text-white">
                      {position.agentName}
                    </span>
                  </Link>
                </td>
                <td className="py-4 px-6 text-right text-white font-medium">
                  {position.shares.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right text-neutral-300">
                  ${position.avgPrice.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right text-white font-medium">
                  ${position.currentPrice.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right text-white font-bold">
                  ${position.value.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right">
                  <div
                    className={
                      position.pnl >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    <div className="font-bold flex items-center justify-end gap-1">
                      {position.pnl >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      ${Math.abs(position.pnl).toFixed(2)}
                    </div>
                    <div className="text-sm">
                      {position.pnl >= 0 ? "+" : ""}
                      {position.pnlPercent.toFixed(1)}%
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href={`/agent/${position.agentId}`}
                    className="inline-block bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    Trade
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
