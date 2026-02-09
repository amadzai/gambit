# Partner Integrations

This document explains **where and why** partner technologies are used in Gambit, with file-level references for ETHGlobal HackMoney 2026 bounty review.

## Uniswap v4 — Linking AI Performance to Market Outcomes

> **TL;DR**: Uniswap v4 gives every AI agent its own market and liquidity, allowing intelligence, confidence, and performance to be priced by the market.

### Why Uniswap v4 Is a Good Fit

Uniswap v4 is a **core primitive** for Gambit because agents are economic actors, not just game entities:

- Each agent gets its own **market** (AgentToken/USDC)
- Agents **own liquidity** and interact autonomously
- Hooks enable **protocol-native economic logic** for dynamic agent behavior

Its singleton architecture makes it possible to deploy **hundreds of agent-specific markets** efficiently.

### Novel Usage Highlights

- **Per-agent markets**: every AI agent has its own Uniswap v4 pool
- **Self-owned LP**: agents can act on their own liquidity
- **AI-driven trading**: swaps and LP management initiated by LLM-driven agents
- **Performance ↔ Market Feedback**: match outcomes influence market cap, which impacts agent strength

> Uniswap v4 is not just a DEX — it’s the **coordination layer linking AI performance to economic outcomes**.

### Future Improvements (Uniswap v4)

- **Dynamic hooks**: adjust fees/liquidity based on agent ELO or win rate
- **Hook-based slashing**: penalize losing agents at the pool level
- **LP strategy agents**: allow autonomous rebalancing of positions
- **Cross-agent pools**: shared pools for agent leagues or competitive tiers

### Where Uniswap v4 Is Used (Code References)

#### 1️⃣ Frontend — Swaps & Trading UI

| Location                                          | Purpose                                                     |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `frontend/lib/contracts/uniswap.ts`               | Uniswap v4 address config, pool keys, price conversions     |
| `frontend/hooks/useAgentContract.ts`              | Main trading hook: executes buy/sell swaps via PoolSwapTest |
| `frontend/components/marketplace/trade-panel.tsx` | UI wiring for swaps and approvals                           |
| `frontend/hooks/useDashboard.ts`                  | Batch price reads for marketplace agents                    |
| `frontend/hooks/useMyDashboard.ts`                | Same for “My Dashboard”                                     |
| `frontend/lib/contracts/abis.ts`                  | ABIs for StateView and PoolSwapTest                         |

#### 2️⃣ Backend — Agent Plugins & Prompts

| Location                                                                  | Purpose                                              |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `backend/src/service-modules/goat/ai/ai-agent.service.ts`                 | Prompts instruct agents to swap through Uniswap v4   |
| `backend/src/service-modules/goat/goat.service.ts`                        | Reserve-management prompt: approve & buy/sell tokens |
| `backend/src/service-modules/goat/events/match-event-listener.service.ts` | Post-match prompt: sell tokens after losses          |
| `backend/src/service-modules/goat/plugins/uniswap-v4/`                    | Plugin for Uniswap v4 operations                     |
| → `uniswap-v4.plugin.ts`                                                  | Plugin definition and tool registration              |
| → `swap.service.ts`                                                       | Swap tools (`swapExactInput`, `getQuote`)            |
| → `position.service.ts`                                                   | LP inspection and management via PositionManager     |

#### 3️⃣ Contracts — AgentFactory & Hooks

| Location                    | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `dapp/src/AgentFactory.sol` | Creates per-agent pools, initializes price, mints two LP positions |
| → Pool creation             | `_createPoolKey`, `poolManager.initialize(...)`                    |
| → LP deployment             | `_addLiquidity(...)` via PositionManager `modifyLiquidities`       |
| → Buy/sell                  | `buyOwnToken` / `sellOwnToken`                                     |
| `dapp/src/GambitHook.sol`   | Hook for protocol & creator fee routing                            |
| `dapp/remappings.txt`       | v4-core & v4-periphery remappings                                  |
| `dapp/script/Deploy.s.sol`  | Base Sepolia Uniswap v4 deployment config                          |

## ENS (Ethereum Name Service) — Human-Readable Identity Layer

> **TL;DR**: ENS provides human-readable names for agents and wallets, improving UX in a multi-agent marketplace.

### Why ENS Is Useful

- Stable, recognizable names for agents and owners
- Clear attribution in marketplaces and match views
- Better demo & judging experience

ENS is **display-only**: authentication and ownership remain on-chain.

### Future Improvements (ENS)

- ENS names for agents themselves (`alpha.gambit.eth`)
- Reverse resolution for agent-owned wallets
- Subdomains minted on agent creation
- Metadata pointing to agent stats and match history
- ENS as canonical agent identity layer, contracts remain source of truth

### Where ENS Is Used (Code References)

| Location                                              | Purpose                                          |
| ----------------------------------------------------- | ------------------------------------------------ |
| `frontend/config/wagmiConfig.ts`                      | Ethereum mainnet setup for ENS resolution        |
| `frontend/components/marketplace/marketplace-nav.tsx` | Resolves and displays ENS names via `useEnsName` |
