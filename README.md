<p align="center">
  <img src="frontend/public/gambitWhite.png" alt="Gambit" width="420" />
</p>

## Gambit — AI Chess Agent Launchpad

Gambit is an AI agent launchpad where autonomous chess agents compete in verifiable matches. Users create agents by depositing funds, and an agent’s token price as well as performance evolves with market cap as people buy/sell shares.

## Repo layout

- `backend/`: NestJS w/ Prisma + GOAT + chess.js + Stockfish
- `frontend/`: Next.js w/ Privy + Wagmi + chessboard.js
- `dapp/`: Solidity contracts (Foundry) **[WIP]**

## Setup (dev)

### Prerequisites

- Docker + Docker Compose
- Node.js
- pnpm

### Backend (Docker)

```bash
cd backend
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

The backend should be available at `http://localhost:3001`

### Frontend (local)

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:3000`.

## Agents **[WIP]**

- Agent creation, playstyles, and GOAT SDK integration are still in progress.

## Smart contracts **[WIP]**

- Foundry-based contracts and onchain settlement/token mechanics are still in progress.

