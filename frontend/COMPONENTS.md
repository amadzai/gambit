# Component guide

Feature components by area. Types live in `types/` (see `types/agent.ts`, `types/marketplace.ts`, `types/chess.ts`). You can import components and their props from barrel files, e.g. `import { LiveMatchCard, type LiveMatchCardProps } from '@/components/marketplace'`.

## Arena

| Component | Purpose | Main props | Types |
|-----------|---------|------------|--------|
| **LiveChessBoard** | Interactive chess board with optional move handling | `position?`, `defaultPosition?`, `onMove?`, `allowDragging?`, `boardWidth?` | Uses FEN; exports `DEFAULT_POSITION` |
| **AgentPanel** | Single agent info (name, playstyle, ELO, win rate) for arena match | `agent`, `color` | `ChessAgent` from `types/agent` |
| **MatchHeader** | White vs black names and match status | `whiteAgent`, `blackAgent`, `status`, `winner?` | `ChessAgent` from `types/agent` |

**Barrel:** `@/components/arena`

## Create

| Component | Purpose | Main props | Types |
|-----------|---------|------------|--------|
| **CreateAgentForm** | Form to create a new chess agent (name, personality, playstyle, first move) | None (uses Privy auth internally) | `Playstyle`, `FirstMove` from `types/agent` |

**Barrel:** `@/components/create`

## Layout

| Component | Purpose | Main props | Types |
|-----------|---------|------------|--------|
| **Navbar** | Main app nav (Leaderboard, Create Agent, Arena) + wallet connect | None | — |

**Barrel:** `@/components/layout`

## Marketplace

| Component | Purpose | Main props | Types |
|-----------|---------|------------|--------|
| **AgentCard** | Agent summary card with chart, price, win rate; links to agent page | `agent` | `MarketplaceAgent` from `types/marketplace` |
| **CreateAgentDialog** | Modal to create agent (playstyle, opening?, personality?, profileImage?) | `open`, `onClose`, `onSubmit?` | `CreateAgentPlaystyle` from `types/agent` |
| **EvaluationBar** | Vertical bar for position evaluation (white vs black) | `evaluation` | — |
| **LiveMatchCard** | Card for one live match (players, mini board, link to match) | `match` | `LiveMatchData` from `types/marketplace` |
| **MarketplaceLeaderboard** | Leaderboard table by ELO, win rate, matches | `agents` | `MarketplaceAgent[]` from `types/marketplace` |
| **MarketplaceNav** | Marketplace header + Create Agent + wallet; owns CreateAgentDialog | None | — |
| **MatchChessBoard** | Read-only or interactive board for match/marketplace views | `position?`, `defaultPosition?`, `boardWidth?`, `interactive?` | Uses `DEFAULT_POSITION` from arena |
| **MoveHistoryPanel** | Move list with evaluations on match page | `moves`, `currentMoveIndex?` | `MatchMove[]` from `types/marketplace` |
| **MyAgentsGrid** | Grid of “my dashboard” agent cards | `agents` | `MyDashboardAgent[]` from `types/marketplace` |
| **PortfolioChart** | Portfolio performance area chart | `data` | `PortfolioChartDataPoint[]` from `types/marketplace` |
| **PositionsTable** | Table of portfolio positions (agent, shares, P&L) | `positions` | `PortfolioPosition[]` from `types/marketplace` |
| **TradePanel** | Buy/sell panel for agent shares | `price`, `agentName?`, `holdings?`, `onBuy?`, `onSell?` | `TradePanelHoldings` from `types/marketplace` (optional) |

**Barrel:** `@/components/marketplace`

## Reference

The `components/reference/` folder contains reference UI only; those components are not used by app routes. See `components/reference/README.md`.
