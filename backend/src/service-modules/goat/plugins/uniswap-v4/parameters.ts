import { createToolParameters } from '@goat-sdk/core';
import { z } from 'zod/v3';

// Type assertion helper: zod/v3 is runtime-compatible with goat-sdk's zod expectations
const toolParams = createToolParameters as (schema: any) => any;

export class SwapParams extends toolParams(
  z.object({
    tokenIn: z.string().describe('Address of the input token to swap from'),
    tokenOut: z.string().describe('Address of the output token to swap to'),
    amountIn: z
      .string()
      .describe('Amount of input token to swap (in base units)'),
    minAmountOut: z
      .string()
      .describe(
        'Minimum amount of output token to receive (in base units). Use 0 for no slippage protection.',
      ),
  }),
) {}

export class GetQuoteParams extends toolParams(
  z.object({
    tokenIn: z.string().describe('Address of the input token'),
    tokenOut: z.string().describe('Address of the output token'),
    amountIn: z
      .string()
      .describe('Amount of input token to quote (in base units)'),
  }),
) {}

export class GetPositionInfoParams extends toolParams(
  z.object({
    tokenId: z
      .string()
      .describe('The NFT token ID of the LP position to query'),
  }),
) {}

export class IncreaseLiquidityParams extends toolParams(
  z.object({
    tokenId: z.string().describe('The NFT token ID of the LP position'),
    amount0Desired: z
      .string()
      .describe('Desired amount of token0 to add (in base units)'),
    amount1Desired: z
      .string()
      .describe('Desired amount of token1 to add (in base units)'),
    amount0Min: z
      .string()
      .describe(
        'Minimum amount of token0 to add (slippage protection, in base units). Use 0 for no slippage protection.',
      ),
    amount1Min: z
      .string()
      .describe(
        'Minimum amount of token1 to add (slippage protection, in base units). Use 0 for no slippage protection.',
      ),
  }),
) {}

export class DecreaseLiquidityParams extends toolParams(
  z.object({
    tokenId: z.string().describe('The NFT token ID of the LP position'),
    liquidityAmount: z.string().describe('Amount of liquidity to remove'),
    amount0Min: z
      .string()
      .describe(
        'Minimum amount of token0 to receive (slippage protection, in base units). Use 0 for no slippage protection.',
      ),
    amount1Min: z
      .string()
      .describe(
        'Minimum amount of token1 to receive (slippage protection, in base units). Use 0 for no slippage protection.',
      ),
  }),
) {}

export class CollectFeesParams extends toolParams(
  z.object({
    tokenId: z
      .string()
      .describe('The NFT token ID of the LP position to collect fees from'),
  }),
) {}
