import { encodeAbiParameters, keccak256 } from 'viem';

// ── Pool configuration constants (must match AgentFactory.sol) ──────
export const POOL_FEE = 3000; // 0.3%
export const TICK_SPACING = 60;
export const TOKEN_DECIMALS = 6; // Both USDC and AgentToken are 6dp
export const AGENT_TOKEN_TOTAL_SUPPLY = 1_000_000_000; // 1 billion tokens

// ── Sqrt price limits for swap (from TickMath) ──────────────────────
/** Minimum sqrt price for zeroForOne swaps (MIN_SQRT_PRICE + 1). */
export const MIN_SQRT_PRICE_LIMIT = BigInt('4295128740') as bigint;
/** Maximum sqrt price for oneForZero swaps (MAX_SQRT_PRICE - 1). */
export const MAX_SQRT_PRICE_LIMIT = BigInt(
  '1461446703485210103287273052203988822378723970341',
) as bigint;

// ── Environment addresses ───────────────────────────────────────────
export function getUniswapAddresses() {
  return {
    stateView: (process.env.NEXT_PUBLIC_STATE_VIEW_ADDRESS ?? '') as `0x${string}`,
    poolSwapTest: (process.env.NEXT_PUBLIC_POOL_SWAP_TEST_ADDRESS ?? '') as `0x${string}`,
    poolManager: (process.env.NEXT_PUBLIC_POOL_MANAGER_ADDRESS ?? '') as `0x${string}`,
    permit2: (process.env.NEXT_PUBLIC_PERMIT2_ADDRESS ?? '') as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '') as `0x${string}`,
    gambitHook: (process.env.NEXT_PUBLIC_GAMBIT_HOOK_ADDRESS ?? '') as `0x${string}`,
  };
}

// ── PoolKey type ────────────────────────────────────────────────────
export interface PoolKey {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
}

/**
 * Build a PoolKey for the given agent token.
 * Currencies are sorted so that the lower address is currency0.
 */
export function getPoolKey(
  tokenAddress: `0x${string}`,
  usdcAddress: `0x${string}`,
  hookAddress: `0x${string}`,
): PoolKey {
  const tokenLower = tokenAddress.toLowerCase();
  const usdcLower = usdcAddress.toLowerCase();

  const [currency0, currency1] =
    usdcLower < tokenLower
      ? [usdcAddress, tokenAddress]
      : [tokenAddress, usdcAddress];

  return {
    currency0,
    currency1,
    fee: POOL_FEE,
    tickSpacing: TICK_SPACING,
    hooks: hookAddress,
  };
}

/**
 * Compute the Uniswap V4 PoolId (bytes32) from a PoolKey.
 * Matches Solidity: `PoolId poolId = PoolIdLibrary.toId(poolKey);`
 */
export function computePoolId(poolKey: PoolKey): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      [
        { name: 'currency0', type: 'address' },
        { name: 'currency1', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
        { name: 'hooks', type: 'address' },
      ],
      [
        poolKey.currency0,
        poolKey.currency1,
        poolKey.fee,
        poolKey.tickSpacing,
        poolKey.hooks,
      ],
    ),
  );
}

/**
 * Convert a Uniswap V4 sqrtPriceX96 value to a human-readable price.
 *
 * price = (sqrtPriceX96 / 2^96)^2 * 10^(decimals0 - decimals1)
 *
 * Since both USDC and AgentToken are 6 decimals, the decimal adjustment
 * factor is 10^0 = 1, so: price = (sqrtPriceX96 / 2^96)^2
 *
 * The returned price represents "how much of currency0 per 1 unit of currency1".
 */
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  decimals0 = TOKEN_DECIMALS,
  decimals1 = TOKEN_DECIMALS,
): number {
  // Use floating point for display purposes
  const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
  const rawPrice = sqrtPrice * sqrtPrice;
  // Adjust for decimal difference
  const decimalAdjustment = 10 ** (decimals0 - decimals1);
  return rawPrice * decimalAdjustment;
}

/**
 * Given a token address and the USDC address, determine whether buying
 * the agent token means swapping zeroForOne (true) or oneForZero (false).
 *
 * Buying = USDC → AgentToken:
 *   - If USDC is currency0: zeroForOne = true  (swap 0 → 1)
 *   - If USDC is currency1: zeroForOne = false (swap 1 → 0)
 */
export function isBuyZeroForOne(
  tokenAddress: `0x${string}`,
  usdcAddress: `0x${string}`,
): boolean {
  return usdcAddress.toLowerCase() < tokenAddress.toLowerCase();
}

/**
 * Convert the sqrtPriceX96 to the price of the agent token in USDC.
 * Accounts for currency ordering in the pool.
 */
export function getAgentTokenPrice(
  sqrtPriceX96: bigint,
  tokenAddress: `0x${string}`,
  usdcAddress: `0x${string}`,
): number {
  const rawPrice = sqrtPriceX96ToPrice(sqrtPriceX96);

  // rawPrice = price of currency1 in terms of currency0
  if (usdcAddress.toLowerCase() < tokenAddress.toLowerCase()) {
    // currency0 = USDC, currency1 = AgentToken
    // rawPrice = USDC per AgentToken → that's what we want
    return rawPrice;
  } else {
    // currency0 = AgentToken, currency1 = USDC
    // rawPrice = AgentToken per USDC → invert
    return rawPrice > 0 ? 1 / rawPrice : 0;
  }
}
