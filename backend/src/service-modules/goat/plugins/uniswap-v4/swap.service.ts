import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { poolSwapTestAbi } from './abis/pool-swap-test.abi.js';
import { quoterAbi } from './abis/quoter.abi.js';
import { SwapParams, GetQuoteParams } from './parameters.js';
import { UNISWAP_V4 } from '../../constants/contracts.js';
import { Abi } from 'viem';

// sqrt price limits for max/min price (from Uniswap V4 constants)
const MIN_SQRT_PRICE_LIMIT = BigInt('4295128739') + 1n;
const MAX_SQRT_PRICE_LIMIT =
  BigInt('1461446703485210103287273052203988822378723970342') - 1n;

export class SwapService {
  private hookAddress: `0x${string}`;
  private poolFee: number;
  private tickSpacing: number;

  constructor(hookAddress: `0x${string}`, poolFee = 3000, tickSpacing = 60) {
    this.hookAddress = hookAddress;
    this.poolFee = poolFee;
    this.tickSpacing = tickSpacing;
  }

  private buildPoolKey(tokenIn: string, tokenOut: string) {
    const addr0 =
      tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
    const addr1 =
      tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;
    return {
      currency0: addr0,
      currency1: addr1,
      fee: this.poolFee,
      tickSpacing: this.tickSpacing,
      hooks: this.hookAddress,
    };
  }

  @Tool({
    description:
      'Swap tokens through a Uniswap V4 pool on Base Sepolia using PoolSwapTest',
  })
  async swapExactInput(
    walletClient: EVMWalletClient,
    parameters: SwapParams,
  ): Promise<string> {
    const poolKey = this.buildPoolKey(parameters.tokenIn, parameters.tokenOut);
    const zeroForOne =
      parameters.tokenIn.toLowerCase() < parameters.tokenOut.toLowerCase();

    const sqrtPriceLimit = zeroForOne
      ? MIN_SQRT_PRICE_LIMIT
      : MAX_SQRT_PRICE_LIMIT;

    const { hash } = await walletClient.sendTransaction({
      to: UNISWAP_V4.POOL_SWAP_TEST,
      abi: poolSwapTestAbi as Abi,
      functionName: 'swap',
      args: [
        poolKey,
        {
          zeroForOne,
          amountSpecified: -BigInt(parameters.amountIn), // negative = exact input
          sqrtPriceLimitX96: sqrtPriceLimit,
        },
        {
          takeClaims: false,
          settleUsingBurn: false,
        },
        '0x', // hookData
      ],
    });
    return `Swap executed. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Get a price quote for swapping tokens through a Uniswap V4 pool on Base Sepolia',
  })
  async getQuote(
    walletClient: EVMWalletClient,
    parameters: GetQuoteParams,
  ): Promise<string> {
    const poolKey = this.buildPoolKey(parameters.tokenIn, parameters.tokenOut);
    const zeroForOne =
      parameters.tokenIn.toLowerCase() < parameters.tokenOut.toLowerCase();

    const result = await walletClient.read({
      address: UNISWAP_V4.QUOTER,
      abi: quoterAbi as Abi,
      functionName: 'quoteExactInputSingle',
      args: [
        {
          poolKey,
          zeroForOne,
          exactAmount: BigInt(parameters.amountIn),
          sqrtPriceLimitX96: 0n,
          hookData: '0x',
        },
      ],
    });

    const [amountOut, gasEstimate] = result.value as [bigint, bigint];
    return `Quote: ${amountOut.toString()} output tokens (gas estimate: ${gasEstimate.toString()})`;
  }
}
