import { mockAgents } from "./mock-data";
import type {
  MarketplaceAgent,
  LiveMatchData,
  MatchMove,
  PortfolioPosition,
  PortfolioChartDataPoint,
  MyDashboardAgent,
} from "@/types/marketplace";

const avatars = ["♔", "♜", "♕", "♖", "♘", "♛", "♗", "♚"];
const colors = [
  "#8B5CF6",
  "#EC4899",
  "#10B981",
  "#06B6D4",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#A855F7",
];

export const marketplaceAgents: MarketplaceAgent[] = mockAgents.map(
  (agent, i) => ({
    ...agent,
    avatar: avatars[i % avatars.length],
    price: +(agent.elo / 1000).toFixed(2),
    priceChange: +((Math.sin(i * 1.5) * 20 + 5) | 0),
    performance: Array.from(
      { length: 6 },
      (_, j) => +(agent.elo / 1000 + (Math.sin(j + i) * 0.3)).toFixed(2)
    ),
    color: colors[i % colors.length],
    description: agent.personality,
    holders: 100 + i * 67,
    volume24h: 10000 + i * 8000,
  })
);

export const mockLiveMatches: LiveMatchData[] = [
  {
    id: "1",
    white: {
      id: "1",
      name: marketplaceAgents[0].name,
      avatar: marketplaceAgents[0].avatar,
      rating: marketplaceAgents[0].elo,
      color: marketplaceAgents[0].color,
    },
    black: {
      id: "3",
      name: marketplaceAgents[2].name,
      avatar: marketplaceAgents[2].avatar,
      rating: marketplaceAgents[2].elo,
      color: marketplaceAgents[2].color,
    },
    position:
      "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    move: 15,
    status: "live",
  },
  {
    id: "2",
    white: {
      id: "4",
      name: marketplaceAgents[3].name,
      avatar: marketplaceAgents[3].avatar,
      rating: marketplaceAgents[3].elo,
      color: marketplaceAgents[3].color,
    },
    black: {
      id: "2",
      name: marketplaceAgents[1].name,
      avatar: marketplaceAgents[1].avatar,
      rating: marketplaceAgents[1].elo,
      color: marketplaceAgents[1].color,
    },
    position: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    move: 8,
    status: "live",
  },
];

export const mockPriceHistory = [
  { time: "00:00", price: 2.1, volume: 5000 },
  { time: "04:00", price: 2.15, volume: 6200 },
  { time: "08:00", price: 2.3, volume: 8900 },
  { time: "12:00", price: 2.25, volume: 7100 },
  { time: "16:00", price: 2.4, volume: 9800 },
  { time: "20:00", price: 2.45, volume: 11200 },
];

export const mockMatchMoves: MatchMove[] = [
  { moveNumber: 1, white: "e4", black: "e5", evaluation: 0.3 },
  { moveNumber: 2, white: "Nf3", black: "Nc6", evaluation: 0.2 },
  { moveNumber: 3, white: "Bb5", black: "a6", evaluation: 0.4 },
  { moveNumber: 4, white: "Ba4", black: "Nf6", evaluation: 0.3 },
  { moveNumber: 5, white: "O-O", black: "Be7", evaluation: 0.5 },
  { moveNumber: 6, white: "d3", black: "b5", evaluation: 0.4 },
  { moveNumber: 7, white: "Bb3", black: "d6", evaluation: 0.6 },
  { moveNumber: 8, white: "c3", evaluation: 0.5 },
];

export const mockPortfolio: PortfolioPosition[] = [
  {
    agentId: "1",
    agentName: marketplaceAgents[0].name,
    avatar: marketplaceAgents[0].avatar,
    shares: 12.5,
    avgPrice: 2.1,
    currentPrice: marketplaceAgents[0].price,
    value: 12.5 * marketplaceAgents[0].price,
    pnl: 12.5 * (marketplaceAgents[0].price - 2.1),
    pnlPercent:
      +((((marketplaceAgents[0].price - 2.1) / 2.1) * 100).toFixed(1)),
    color: marketplaceAgents[0].color,
  },
  {
    agentId: "2",
    agentName: marketplaceAgents[1].name,
    avatar: marketplaceAgents[1].avatar,
    shares: 8.3,
    avgPrice: 6.2,
    currentPrice: marketplaceAgents[1].price,
    value: 8.3 * marketplaceAgents[1].price,
    pnl: 8.3 * (marketplaceAgents[1].price - 6.2),
    pnlPercent:
      +((((marketplaceAgents[1].price - 6.2) / 6.2) * 100).toFixed(1)),
    color: marketplaceAgents[1].color,
  },
  {
    agentId: "3",
    agentName: marketplaceAgents[2].name,
    avatar: marketplaceAgents[2].avatar,
    shares: 25.0,
    avgPrice: 0.85,
    currentPrice: marketplaceAgents[2].price,
    value: 25.0 * marketplaceAgents[2].price,
    pnl: 25.0 * (marketplaceAgents[2].price - 0.85),
    pnlPercent:
      +((((marketplaceAgents[2].price - 0.85) / 0.85) * 100).toFixed(1)),
    color: marketplaceAgents[2].color,
  },
  {
    agentId: "6",
    agentName: marketplaceAgents[5].name,
    avatar: marketplaceAgents[5].avatar,
    shares: 5.1,
    avgPrice: 5.8,
    currentPrice: marketplaceAgents[5].price,
    value: 5.1 * marketplaceAgents[5].price,
    pnl: 5.1 * (marketplaceAgents[5].price - 5.8),
    pnlPercent:
      +((((marketplaceAgents[5].price - 5.8) / 5.8) * 100).toFixed(1)),
    color: marketplaceAgents[5].color,
  },
];

export const mockPortfolioHistory: PortfolioChartDataPoint[] = [
  { date: "Jan 1", value: 120 },
  { date: "Jan 8", value: 125 },
  { date: "Jan 15", value: 122 },
  { date: "Jan 22", value: 135 },
  { date: "Jan 29", value: 140 },
  { date: "Feb 5", value: 145.67 },
];

export const mockRecentMatches = [
  { opponent: "Neural Knight", result: "win" as const, moves: 45, rating: 2580 },
  { opponent: "Rook Reaper", result: "loss" as const, moves: 67, rating: 2920 },
  { opponent: "AlphaGambit", result: "win" as const, moves: 38, rating: 2650 },
  { opponent: "Queen's Gambit AI", result: "draw" as const, moves: 89, rating: 3100 },
  { opponent: "Stockfish Sentinel", result: "win" as const, moves: 52, rating: 3200 },
];

export const mockMyAgents: MyDashboardAgent[] = [
  {
    id: "my1",
    name: "DeepMind Warrior",
    avatar: "♚",
    rating: 2720,
    wins: 89,
    losses: 34,
    draws: 12,
    price: 3.45,
    priceChange: 8.3,
    marketCap: 172500,
    holders: 523,
    color: "#3B82F6",
    status: "active" as const,
    created: "2026-01-15",
  },
  {
    id: "my2",
    name: "Tactical Titan",
    avatar: "♗",
    rating: 2580,
    wins: 45,
    losses: 23,
    draws: 8,
    price: 1.89,
    priceChange: -2.1,
    marketCap: 94500,
    holders: 287,
    color: "#F59E0B",
    status: "active" as const,
    created: "2026-02-01",
  },
];
