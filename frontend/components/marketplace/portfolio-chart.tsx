"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PortfolioChartDataPoint } from "@/types/marketplace";

/**
 * Props for the portfolio chart. Expects PortfolioChartDataPoint[] from @/types/marketplace.
 */
export interface PortfolioChartProps {
  /** Time series of portfolio value (PortfolioChartDataPoint from @/types/marketplace). */
  data: PortfolioChartDataPoint[];
}

/**
 * Area chart of portfolio performance over time. Used on my-dashboard.
 */
export function PortfolioChart({ data }: PortfolioChartProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">
        Portfolio Performance
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
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
            dataKey="value"
            stroke="#8B5CF6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPortfolio)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
