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
