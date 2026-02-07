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
- **AI Agents**: OpenRouter (`z-ai/glm-4.7-flash`) for playstyle-based move selection
- **Real-time**: Server-Sent Events (SSE) for match streaming

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
| `playstyle` | Aggressive, Defensive, or Positional |
| `opening` | Preferred opening hint (string; optionally UCI like `e2e4`) |
| `profileImage` | URL (stored in Supabase later) |
| `elo` | Rating derived from market cap |
| `marketCap` | Total value of agent's token |

### Playstyles

- **Aggressive**: Prefers attacking moves, sacrifices, forward momentum
- **Defensive**: Solid, prophylactic moves, prioritizes safety
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
├── interfaces/
│   ├── chess-engine.interface.ts # Stockfish request/response types
│   └── chess-rules.interface.ts  # Move execution types
└── providers/
    ├── chess-rules.service.ts   # chess.js integration (rules, validation)
    └── chess-engine.service.ts  # Stockfish integration (move generation)
```

### Backend Match Service (`/backend/src/service-modules/match/`)

```
match/
├── match.module.ts              # Module definition (imports AgentServiceModule + ChessServiceModule)
├── interfaces/
│   └── match.interface.ts       # MatchStartRequest, MatchMoveEvent types
└── providers/
    └── match.service.ts         # Match orchestration (game loop + SSE streaming)
```

### Move Generation Flow

1. Backend agent calls `ChessRulesService.requestMove(...)` with the current position (via `gameId` / `fen` / `pgn`) and agent strength (ELO/skill)
2. `ChessRulesService` resolves the position to a FEN and forwards it to `ChessEngineService` (Stockfish)
3. Stockfish generates **N candidate moves** using `MultiPV` (default **10**) at the requested strength
4. If the agent has a preferred opening in **UCI** (e.g. `e2e4`) and that move is present in the candidate list, we pick it immediately (no LLM call)
5. Otherwise, the backend agent calls OpenRouter (`z-ai/glm-4.7-flash`) with the candidate list + agent metadata (playstyle/personality) and asks the LLM to pick **one** candidate **by index** (e.g. `{"pick": 3}`)
6. Agent selects the candidate **UCI** move, converts it to `{ from, to, promotion? }`, then calls `ChessRulesService.makeMove(...)` to validate + persist the move (updates `fen`/`pgn` in DB)
   - If the LLM response is invalid/unparseable/out of range, we fall back to Stockfish's top candidate

Notes:
- We keep things simple by assuming **only 1 live match at a time**, so a single Stockfish process with serialized requests is sufficient.
- OpenRouter calls default to `reasoning.effort: "none"` to avoid spending output tokens on reasoning traces (we only want the final JSON).

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

### Match Service (Orchestrator)

Responsibilities:
- Creates a game and kicks off a background loop that alternates agent moves
- Streams each move to clients via **Server-Sent Events (SSE)** using NestJS `@Sse()` decorator
- Holds active match streams in-memory as RxJS `Subject<MessageEvent>` keyed by `gameId`
- Configurable defaults: `multiPv=10`, `movetimeMs=200`, `delayMs=2000` (inter-move delay for frontend animation)

Match orchestration flow:
1. `POST /match/start` → `MatchService.startMatch()` creates a game via `ChessRulesService.createGame()`, returns `{ gameId }` immediately
2. Background loop (`runMatchLoop`) alternates calling `AgentService.makeAgentMove()` for white/black
3. After each move, a `MatchMoveEvent` (FEN, PGN, SAN, UCI, status, agent info) is pushed into the SSE stream
4. Client subscribes via `GET /match/:id/stream` (SSE) to receive events in real-time
5. When game status is no longer `ACTIVE` (checkmate/stalemate/draw), the stream completes

---

## Match System

### Match Lifecycle

1. **Match Creation**: Two agents agree to match, each stakes % of POL
2. **Match Execution**: Chess match runs off-chain, moves validated by engine and streamed via SSE
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
/chess/*
```

Notes:
- Swagger UI is available at `/api` and the OpenAPI JSON is at `/api-json`.
- Most chess endpoints are backed by `ChessRulesService`.
- The Stockfish integration is internal (used via `ChessRulesService.requestMove(...)`), but we expose a **debug** endpoint to inspect candidates:
  - `GET /chess/games/:id/engine-moves?multiPv=10&elo=1500&movetimeMs=200`

### Agents Controller (`/backend/src/api-modules/agents/`)

All agent-related endpoints route through:

```
/agents/*
```

Key endpoints:
- `POST /agents` create agent
- `GET /agents` list agents
- `GET /agents/:id` get agent
- `PUT /agents/:id` update agent
- `POST /agents/:id/move` make a move for that agent in a specific game

Notes:
- `/agents/:id/move` validates that the agent is assigned to the game (`whiteAgentId` / `blackAgentId`) and that it is that agent's turn.

### Match Controller (`/backend/src/api-modules/match/`)

All match-related endpoints route through:

```
/match/*
```

Key endpoints:
- `POST /match/start` start a match between two agents (body: `{ whiteAgentId, blackAgentId, multiPv?, movetimeMs?, delayMs? }`)
- `GET /match/:id/stream` SSE endpoint that streams `MatchMoveEvent` after each move until the game ends

Notes:
- The `start` endpoint returns `{ gameId }` immediately. The match loop runs in the background.
- The `stream` endpoint uses NestJS `@Sse()` decorator and returns an `Observable<MessageEvent>`. The client subscribes with the browser `EventSource` API.
- Each SSE event contains: `gameId`, `moveNumber`, `fen`, `pgn`, `san`, `selectedUci`, `turn`, `status`, `winner`, `agentId`, `agentName`, `fallbackUsed`.

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

enum Winner {
  WHITE
  BLACK
  DRAW
}

model ChessGame {
  id        String     @id @default(cuid())
  fen       String     // Current board state
  pgn       String     @default("") // Move history (movetext only; headers stripped)
  turn      Color      // Whose turn
  status    GameStatus // Game state
  winner    Winner?    // Winner (set on terminal states)

  whiteAgentId String
  blackAgentId String

  whiteAgent Agent @relation("WhiteGames", fields: [whiteAgentId], references: [id])
  blackAgent Agent @relation("BlackGames", fields: [blackAgentId], references: [id])

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

enum Playstyle {
  AGGRESSIVE
  DEFENSIVE
  POSITIONAL
}

model Agent {
  id           String    @id @default(cuid())
  name         String
  playstyle    Playstyle
  opening      String?
  personality  String?
  profileImage String?
  elo          Int       @default(1000)

  whiteGames ChessGame[] @relation("WhiteGames")
  blackGames ChessGame[] @relation("BlackGames")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Planned Models

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
- [x] Prisma schema with game + agent models
- [x] Chess Rules Service core implementation (create game, load position, legal moves, validate move, make move, resign)
- [x] Chess Engine Service integrated (Stockfish MultiPV candidate move generation + debug endpoint)
- [x] Agent model + Agent API (`/agents/*`)
- [x] Agent move selection via OpenRouter (`z-ai/glm-4.7-flash`) over Stockfish MultiPV candidates
- [x] Match Service with SSE streaming (`/match/start`, `/match/:id/stream`)

### In Progress
- [ ] Frontend ↔ Backend SSE integration (arena page consuming match stream)

### Planned
- [ ] Smart contracts (Foundry)
- [ ] Backend ↔ Dapp integration

---

## Development Priorities

### Phase 1: Chess Backend
1. Complete chess.js rules system
2. Integrate Stockfish engine
3. Implement move generation with skill levels

### Phase 2: Agent System
1. OpenRouter integration for style-based move selection (`z-ai/glm-4.7-flash`)
2. Agent creation and management

### Phase 3: Match System
1. Match orchestration service
2. Turn-based game loop with alternating agent moves
3. SSE streaming of match events to frontend
4. Result determination (checkmate/stalemate/draw)

### Phase 4: Smart Contracts
1. Agent token deployment
2. Uniswap v4 pool creation
3. Match settlement logic

### Phase 5: Integration
1. Frontend ↔ Backend SSE connections (arena page)
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
docker compose -f docker-compose.dev.yml up --build
pnpm prisma generate
pnpm prisma db push
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
- OpenRouter (`z-ai/glm-4.7-flash`) - LLM-based move selection among Stockfish candidates
- `@prisma/client` - Database ORM
- `@nestjs/*` - Backend framework
- `rxjs` - SSE streaming via RxJS Subjects/Observables

### Frontend
- `chessboardjs` - Chess board UI
- `@privy-io/react-auth` - Wallet authentication
- `wagmi` - Ethereum hooks
- `next` - React framework

### Dapp
- `forge-std` - Foundry testing utilities
- Uniswap v4 core/periphery contracts
