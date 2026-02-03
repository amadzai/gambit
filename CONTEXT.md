# Gambit - AI Chess Agent Launchpad

> **HackMoney 2026 Project**

## Overview

Gambit is an AI agent launchpad where autonomous chess agents compete in verifiable matches. Users can create AI chess agents by depositing funds, and the agent's token price (and implied strength) evolves with market cap as people buy/sell shares. The platform ties agent performance to real, market-native economic outcomes in the Ethereum ecosystem.

### Core Concept

- Users create AI chess agents by depositing ETH
- Each agent has an associated ERC-20 token
- Agent ELO rating is directly correlated to market cap (buying shares increases ELO)
- Agents battle each other, with winners receiving funds from losers

---

## Tech Stack

### Monorepo Structure

```
gambit/
├── backend/          # NestJS + Prisma
├── frontend/         # Next.js
└── dapp/             # Foundry (Solidity)
```

### Backend (`/backend`)

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Chess Rules**: chess.js
- **Chess Engine**: Stockfish
- **AI Agents**: GOAT SDK

### Frontend (`/frontend`)

- **Framework**: Next.js
- **Chess UI**: chessboardjs
- **Wallet Integration**: Privy + wagmi

### Smart Contracts (`/dapp`)

- **Framework**: Foundry
- **DEX Integration**: Uniswap v4 (hooks for programmable AMM behavior)
- **Token Standard**: ERC-20

---

## Agent System

### Agent Properties (tentative)

| Property | Description |
|----------|-------------|
| `name` | Agent display name |
| `personality` | Agent character description |
| `playstyle` | Aggressive, Defensive, Balanced, Chaotic, or Positional |
| `firstMove` | Opening move (e4, d4, c4, Nf3, g3, b3, f4) |
| `elo` | Rating derived from market cap |
| `marketCap` | Total value of agent's token |

### Playstyles

- **Aggressive**: Prefers attacking moves, sacrifices, forward momentum
- **Defensive**: Solid, prophylactic moves, prioritizes safety
- **Balanced**: Mix of attack and defense based on position
- **Chaotic**: Unpredictable, may choose suboptimal but tricky moves
- **Positional**: Focus on piece placement, pawn structure, long-term advantages

### ELO ↔ Market Cap Correlation

```
Market Cap = Chess ELO
```

- Buying shares of an agent increases their ELO rating
- Selling shares decreases their ELO rating
- Higher ELO = stronger Stockfish skill level when computing moves

---

## Chess System Architecture

### Backend Chess Service (`/backend/src/service-modules/chess-service/`)

```
chess-service/
├── chess-service.module.ts      # Module definition
└── providers/
    ├── chess-rules.service.ts   # chess.js integration (rules, validation)
    └── chess-engine.service.ts  # Stockfish integration (move generation)
```

### Move Generation Flow

1. Agent requests moves from backend
2. Backend determines agent's ELO → Stockfish skill level mapping
3. Stockfish generates N candidate moves at that skill level
4. Agent's playstyle filters/ranks the moves:
   - Aggressive → prioritize attacking moves
   - Positional → prioritize solid, strategic moves
   - etc.
5. Selected move is returned and executed

### Chess Rules Service (chess.js)

Responsibilities:
- Game state management (FEN strings)
- Move validation
- Check/checkmate/stalemate detection
- Legal move generation
- Turn management

### Chess Engine Service (Stockfish)

Responsibilities:
- Move evaluation and generation
- Skill level adjustment based on ELO
- Multi-move candidate generation
- Position analysis

---

## Match System

### Match Lifecycle

1. **Match Creation**: Two agents agree to match, each stakes % of POL
2. **Match Execution**: Chess match runs off-chain, moves validated by engine
3. **Match Settlement**: Result verified, liquidity transferred

### Outcome Economics

| Outcome | Effect |
|---------|--------|
| **Win** | Winner receives funds from loser's POL |
| **Loss** | Loser's POL reduced, transferred to winner |
| **Draw** | Lower ELO agent wins small amount (incentivizes underdogs) |

---

## API Structure

### Chess Controller (`/backend/src/api-modules/chess/`)

All chess-related endpoints route through:

```
/api/chess/*
```

The controller interfaces with all chess service providers:
- Chess Rules Service
- Chess Engine Service (planned)

---

## Database Schema

### Current Models

```prisma
enum Color {
  WHITE
  BLACK
}

enum GameStatus {
  ACTIVE
  CHECKMATE
  STALEMATE
  DRAW
  RESIGNED
}

model ChessGame {
  id        String     @id @default(cuid())
  fen       String     // Current board state
  turn      Color      // Whose turn
  status    GameStatus // Game state
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

### Planned Models

- `Agent` - AI agent configuration and stats
- `Match` - Match records between agents
- `Move` - Individual move history

---

## Smart Contract Architecture (tentative)

### Core Contracts

| Contract | Purpose |
|----------|---------|
| `AgentFactory` | Creates new agents and their tokens |
| `AgentToken` | ERC-20 token for each agent |
| `AgentVault` | Treasury and protocol-owned liquidity |
| `MatchEngine` | Match registration, stake locking, outcome verification |
| `LiquiditySettlement` | Handles POL transfers on match completion |
| `BuybackExecutor` | TWAP buybacks for winners |

### Uniswap v4 Integration

- Pool pair: `AGENT_TOKEN / ETH`
- Custom hooks for:
  - Fee redirection to AgentVault
  - Dynamic fee tiers based on performance **[WIP]**
  - Cooldowns after settlement
  - MEV protection

---

## Current Progress

### Completed
- [x] Frontend UI (chessboard, agent creation form, arena view)
- [x] Basic NestJS backend structure
- [x] Prisma schema with game model
- [x] Chess Rules Service scaffold (chess.js)

### In Progress
- [ ] Chess Rules Service implementation (full chess.js integration)
- [ ] Chess Engine Service (Stockfish integration)

### Planned
- [ ] Agent Service (GOAT SDK integration)
- [ ] Match Service (game orchestration)
- [ ] Smart contracts (Foundry)
- [ ] Backend ↔ Dapp integration

---

## Development Priorities

### Phase 1: Chess Backend (Current)
1. Complete chess.js rules system
2. Integrate Stockfish engine
3. Implement move generation with skill levels

### Phase 2: Agent System
1. GOAT SDK integration
2. Playstyle-based move selection
3. Agent creation and management

### Phase 3: Match System
1. Match orchestration
2. Turn-based game loop
3. Result determination

### Phase 4: Smart Contracts
1. Agent token deployment
2. Uniswap v4 pool creation
3. Match settlement logic

### Phase 5: Integration
1. Frontend ↔ Backend WebSocket connections
2. Backend ↔ Blockchain event listeners
3. End-to-end match flow

---

## Environment Setup

### Backend

```bash
cd backend
pnpm install
cp .env.example .env
# Configure DATABASE_URL
docker-compose -f docker-compose.dev.yml up -d  # PostgreSQL
pnpm prisma generate
pnpm prisma db push
pnpm run start:dev
```

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### Dapp

```bash
cd dapp
forge install
forge build
forge test
```

---

## Key Dependencies

### Backend
- `chess.js` - Chess rules and move validation
- `stockfish` - Chess engine for move generation
- `@goat-sdk/*` - AI agent framework
- `@prisma/client` - Database ORM
- `@nestjs/*` - Backend framework

### Frontend
- `chessboardjs` - Chess board UI
- `@privy-io/react-auth` - Wallet authentication
- `wagmi` - Ethereum hooks
- `next` - React framework

### Dapp
- `forge-std` - Foundry testing utilities
- Uniswap v4 core/periphery contracts
