import { createToolParameters } from '@goat-sdk/core';
import { z } from 'zod/v3';

// Type assertion helper: zod/v3 is runtime-compatible with goat-sdk's zod expectations
// but TypeScript sees them as different types since the project uses zod@4.
const toolParams = createToolParameters as (schema: any) => any;

/**
 * Get the balance of a specific ERC20 token for the agent's own wallet.
 * Only needs the token contract address — wallet address is auto-injected.
 */
export class GetMyTokenBalanceParams extends toolParams(
  z.object({
    tokenAddress: z
      .string()
      .describe('The ERC20 token contract address to check the balance of'),
  }),
) {}

/**
 * Send USDC from the agent wallet.
 * Only needs the recipient and amount in human-readable USDC (e.g. "50").
 * USDC contract address and decimal conversion are handled automatically.
 */
export class SendUsdcParams extends toolParams(
  z.object({
    to: z.string().describe('The recipient wallet address'),
    amount: z
      .string()
      .describe(
        'The amount of USDC to send in human-readable units (e.g. "50" for 50 USDC)',
      ),
  }),
) {}

/**
 * Transfer any ERC20 token from the agent's own wallet to another address.
 * Amount is in human-readable units (e.g. "100" for 100 tokens) —
 * decimal conversion is handled automatically by reading the token's decimals.
 */
export class TransferTokenParams extends toolParams(
  z.object({
    tokenAddress: z
      .string()
      .describe('The ERC20 token contract address to transfer'),
    to: z.string().describe('The recipient wallet address'),
    amount: z
      .string()
      .describe(
        'The amount of tokens to send in human-readable units (e.g. "100" for 100 tokens). Decimals are converted automatically.',
      ),
  }),
) {}

/**
 * No parameters needed — USDC address and wallet address are both auto-injected.
 */
export class EmptyParams extends toolParams(z.object({})) {}
