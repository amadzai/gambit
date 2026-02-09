# Partner Integrations

This document explains **where and why** partner technologies are used in Gambit,
with file‑level references for ETHGlobal HackMoney 2026 bounty review.

## Quick Links

- 🔗 [Uniswap v4 Integration](#uniswap-v4--coordination-layer-between-ai-performance-and-economic-outcomes)
- 🔗 [ENS Integration](#ens-ethereum-name-service)

---

## Uniswap v4 — Coordination Layer Between AI Performance and Economic Outcomes

> **TL;DR**: Uniswap v4 gives every AI agent its own market and liquidity, allowing
> intelligence, confidence, and performance to be priced by the market.

### Why Uniswap v4 Is a Good Fit

Uniswap v4 is a core primitive for Gambit because agents are **economic actors**, not
just game entities.

- Each agent requires its own **market** (AgentToken/USDC)
- Agents must **own liquidity** and interact with it autonomously
- Pool‑level customization (hooks) enables protocol‑native economic logic

Uniswap v4’s singleton architecture and hooks make it possible to deploy **hundreds of
agent‑specific markets** with predictable behavior and low overhead.

---

### What’s Novel About Our Usage

- **Per‑agent markets**: every AI agent gets its own Uniswap v4 pool
- **Self‑owned LP**: agents own part of their own liquidity and can act on it
- **AI‑driven trading**: swaps and LP management are initiated by LLM‑driven agents
- **Performance ↔ market feedback loop**: match outcomes affect market cap, which
  feeds back into agent strength

This goes beyond a typical “DEX integration” — Uniswap v4 becomes the **coordination
layer between AI performance and economic outcomes**.

---

### Future Improvements (Uniswap v4)

- **Dynamic hooks**: adjust fees or liquidity behavior based on agent ELO or win rate
- **Hook‑based slashing**: penalize agents economically after losses directly at the
  pool level
- **LP strategy agents**: allow agents to rebalance or widen/narrow ranges autonomously
- **Cross‑agent pools**: shared pools for agent leagues or competitive tiers

---

### Where Uniswap v4 Is Used (Code References)

#### 1. Frontend — Swapping / Buying & Selling Tokens

| Location                                              | Purpose                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`frontend/lib/contracts/uniswap.ts`**               | Uniswap v4 address config, pool key / PoolId helpers, sqrt price limits, and price conversion. Used by all frontend swap flows.                                      |
| **`frontend/hooks/useAgentContract.ts`**              | Main trading hook: reads pool state via StateView (`getSlot0`), executes **buy** (USDC → AgentToken) and **sell** (AgentToken → USDC) via **PoolSwapTest** `swap()`. |
| **`frontend/components/marketplace/trade-panel.tsx`** | Buy/sell UI wiring approvals and swaps.                                                                                                                              |
| **`frontend/hooks/useDashboard.ts`**                  | Batch Uniswap price reads for marketplace agents via StateView.                                                                                                      |
| **`frontend/hooks/useMyDashboard.ts`**                | Same pattern for “My Dashboard” agents.                                                                                                                              |
| **`frontend/lib/contracts/abis.ts`**                  | ABIs for Uniswap v4 **StateView** and **PoolSwapTest**.                                                                                                              |

So: **swap execution** lives in `useAgentContract.ts`; **price display** uses StateView
in trading and dashboard hooks; **config/helpers** live in
`frontend/lib/contracts/uniswap.ts`.

---

#### 2. Backend — Agent Uses Uniswap (Prompts + Plugins)

| Location                                                                       | Purpose                                                                                                                          |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **`backend/src/service-modules/goat/ai/ai-agent.service.ts`**                  | Agent system prompt describes how to swap through Uniswap v4 and buy/sell own token; registers `uniswapV4` and `gambit` plugins. |
| **`backend/src/service-modules/goat/goat.service.ts`**                         | Reserve‑management prompt instructs agents to approve PoolSwapTest and buy/sell tokens.                                          |
| **`backend/src/service-modules/goat/events/match-event-listener.service.ts`**  | Post‑match prompt instructs losing agents to approve and sell tokens.                                                            |
| **`backend/src/service-modules/goat/constants/contracts.ts`**                  | Base Sepolia Uniswap v4 contract addresses.                                                                                      |
| **`backend/src/service-modules/goat/plugins/uniswap-v4/`**                     | Uniswap v4 GOAT plugin.                                                                                                          |
| → **`uniswap-v4.plugin.ts`**                                                   | Plugin definition and tool registration.                                                                                         |
| → **`swap.service.ts`**                                                        | Tools: `swapExactInput` (PoolSwapTest), `getQuote` (Quoter).                                                                     |
| → **`position.service.ts`**                                                    | Tools: LP inspection and management via PositionManager.                                                                         |
| **`backend/src/service-modules/goat/plugins/gambit/agent-factory.service.ts`** | Gambit tools (`createAgent`, `buyOwnToken`, `sellOwnToken`) that route swaps through Uniswap v4.                                 |

---

#### 3. Contracts — AgentFactory Deploys LP on Uniswap v4

| Location                        | Purpose                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **`dapp/src/AgentFactory.sol`** | Creates per‑agent Uniswap v4 pools (AgentToken/USDC), initializes price, and mints **two LP positions** (user + agent) via PositionManager. |
| → Pool creation                 | `_createPoolKey`, `poolManager.initialize(...)`                                                                                             |
| → LP deployment                 | `_addLiquidity(...)` via PositionManager `modifyLiquidities`                                                                                |
| → Buy/sell                      | `buyOwnToken` / `sellOwnToken` execute PositionManager‑encoded swaps                                                                        |
| **`dapp/src/GambitHook.sol`**   | Uniswap v4 hook for protocol + creator fee routing.                                                                                         |
| **`dapp/remappings.txt`**       | v4‑core and v4‑periphery remappings.                                                                                                        |
| **`dapp/script/Deploy.s.sol`**  | Base Sepolia Uniswap v4 deployment config.                                                                                                  |

---

## ENS (Ethereum Name Service) — Human‑Readable Identity Layer for Agents and Wallets

> **TL;DR**: ENS improves usability by showing human‑readable names instead of raw
> addresses in a multi‑agent marketplace.

### Why ENS Is a Good Fit as an Identity Layer

ENS serves as a **human‑readable identity layer** for Gambit agents and users.

Each agent and user interacts through multiple contracts and wallets. ENS provides:

- A stable, recognizable name for agents and their owners
- Clear attribution in marketplaces and match views
- Better UX during demos and judging

ENS is intentionally used at the **display layer only** — it does not perform authentication, authorization, or access control.

### Future Improvements (ENS)

- ENS names for **agents themselves** (e.g. `alpha.gambit.eth`)
- Reverse resolution for agent‑owned wallets
- ENS subdomains minted on agent creation
- ENS metadata pointing to agent stats and match history
- Treat ENS as the canonical agent identity (name + metadata), with contracts remaining the source of truth for ownership and permissions

---

### Where ENS Is Used (Code References)

| Location                                                  | Purpose                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **`frontend/config/wagmiConfig.ts`**                      | Includes Ethereum mainnet solely for ENS resolution.                               |
| **`frontend/components/marketplace/marketplace-nav.tsx`** | Resolves and displays ENS names via `useEnsName`; falls back to truncated address. |

ENS is not used elsewhere in the codebase.
