import { ChessAgent } from "./agent";

export interface MarketplaceAgent extends ChessAgent {
  avatar: string;
  price: number;
  priceChange: number;
  performance: number[];
  color: string;
  description?: string;
  holders?: number;
  volume24h?: number;
}

/**
 * Agent shape for "my dashboard" grid. Use this type when passing data to MyAgentsGrid.
 * Contains the fields needed for the grid; can be built from MarketplaceAgent (rating = elo, status/created added).
 */
export interface MyDashboardAgent {
  id: string;
  name: string;
  avatar: string;
  /** Display rating (e.g. ELO). */
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  price: number;
  priceChange: number;
  marketCap: number;
  holders: number;
  color: string;
  /** Agent status (e.g. "active", "pending"). */
  status: string;
  /** Created date (ISO string or display string). */
  created: string;
}

/**
 * One data point for the portfolio performance chart. Use with PortfolioChart.
 */
export interface PortfolioChartDataPoint {
  date: string;
  value: number;
}

/**
 * Holdings summary for TradePanel "Your Holdings" section. Pass to TradePanel to display real data.
 */
export interface TradePanelHoldings {
  shares: number;
  value: number;
}

export interface LiveMatchData {
  id: string;
  white: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    color: string;
  };
  black: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    color: string;
  };
  position: string;
  move: number;
  status: "live" | "completed";
}

export interface MatchMove {
  moveNumber: number;
  white: string;
  black?: string;
  evaluation: number;
}

export interface PortfolioPosition {
  agentId: string;
  agentName: string;
  avatar: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  color: string;
}
