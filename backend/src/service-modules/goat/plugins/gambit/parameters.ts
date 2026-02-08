import { createToolParameters } from '@goat-sdk/core';
import { z } from 'zod/v3';

// Type assertion helper: zod/v3 is runtime-compatible with goat-sdk's zod expectations
// but TypeScript sees them as different types since the project uses zod@4.
const toolParams = createToolParameters as (schema: any) => any;

// ── AgentFactory ────────────────────────────────────────────────────
export class CreateAgentParams extends toolParams(
  z.object({
    name: z.string().describe('The name of the agent token'),
    symbol: z.string().describe('The symbol of the agent token'),
    usdcAmount: z
      .string()
      .describe('USDC amount to fund the agent (in base units, 6 decimals)'),
    agentWallet: z
      .string()
      .describe('The wallet address that will own the agent'),
  }),
) {}

export class GetMarketCapParams extends toolParams(
  z.object({
    agentToken: z
      .string()
      .describe('The agent token address to check market cap for'),
  }),
) {}

export class GetAgentInfoParams extends toolParams(
  z.object({
    tokenAddress: z
      .string()
      .describe('The agent token address to get info for'),
  }),
) {}

export class BuyOwnTokenParams extends toolParams(
  z.object({
    agentToken: z
      .string()
      .describe('The agent token address to buy'),
    usdcAmount: z
      .string()
      .describe('Amount of USDC to spend (in base units, 6 decimals)'),
  }),
) {}

// ── MatchEngine ───────────────────────────────────────────────────
export class ChallengeParams extends toolParams(
  z.object({
    myAgentToken: z
      .string()
      .describe('Token address of the challenging agent'),
    opponentToken: z
      .string()
      .describe('Token address of the agent being challenged'),
    stakeAmount: z
      .string()
      .describe('Amount of USDC to stake on the match (in base units, 6 decimals)'),
  }),
) {}

export class AcceptChallengeParams extends toolParams(
  z.object({
    matchId: z.string().describe('The bytes32 match ID to accept'),
  }),
) {}

export class DeclineChallengeParams extends toolParams(
  z.object({
    matchId: z.string().describe('The bytes32 match ID to decline'),
  }),
) {}

export class SettleMatchParams extends toolParams(
  z.object({
    matchId: z.string().describe('The bytes32 match ID to settle'),
    winnerToken: z
      .string()
      .describe(
        'The address of the winning agent token (address(0) for draw)',
      ),
    signature: z
      .string()
      .describe('Backend-signed authorization for settling'),
  }),
) {}

export class CancelMatchParams extends toolParams(
  z.object({
    matchId: z.string().describe('The bytes32 match ID to cancel'),
    signature: z
      .string()
      .describe('Backend-signed authorization for cancelling'),
  }),
) {}

export class CancelExpiredChallengeParams extends toolParams(
  z.object({
    matchId: z
      .string()
      .describe('The bytes32 match ID of the expired challenge to cancel'),
  }),
) {}

export class GetMatchParams extends toolParams(
  z.object({
    matchId: z.string().describe('The bytes32 match ID to look up'),
  }),
) {}

// ── GambitHook ─────────────────────────────────────────────────────
export class ClaimRewardsParams extends toolParams(
  z.object({
    currency: z
      .string()
      .describe('The currency (token address) to claim fees for'),
  }),
) {}

export class GetClaimableParams extends toolParams(
  z.object({
    account: z.string().describe('The account address to check claimable for'),
    currency: z
      .string()
      .describe('The currency (token address) to check claimable for'),
  }),
) {}

// ── Common / empty ──────────────────────────────────────────────────
// Some @Tool() methods don't require user-supplied inputs, but GOAT's tool
// decorator still expects a `createToolParameters(...)` class argument.
export class EmptyParams extends toolParams(z.object({})) {}
