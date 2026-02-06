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
