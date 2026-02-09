import { encodeAbiParameters, keccak256 } from 'viem';

// ── Pool configuration constants (must match AgentFactory.sol) ──────
export const POOL_FEE = 3000; // 0.3%
export const TICK_SPACING = 60;
export const TOKEN_DECIMALS = 6; // Both USDC and AgentToken are 6dp
export const AGENT_TOKEN_TOTAL_SUPPLY = 1_000_000_000; // 1 billion tokens

/** AgentFactory creates hookless pools; use this so poolId matches on-chain. */
export const HOOKLESS_HOOKS =
  '0x0000000000000000000000000000000000000000' as `0x${string}`;

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
 * The returned price represents "how many units of currency1 per 1 unit of currency0".
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

  // rawPrice = (sqrtPriceX96 / 2^96)^2 = token1 / token0
  // i.e. how many units of token1 per 1 unit of token0
  if (usdcAddress.toLowerCase() < tokenAddress.toLowerCase()) {
    // currency0 = USDC, currency1 = AgentToken
    // rawPrice = AgentToken per USDC → invert to get USDC per AgentToken
    return rawPrice > 0 ? 1 / rawPrice : 0;
  } else {
    // currency0 = AgentToken, currency1 = USDC
    // rawPrice = USDC per AgentToken → that's what we want
    return rawPrice;
  }
}

// ── Market Cap → ELO mapping ────────────────────────────────────────
const ELO_SCALE = 500;
// /** Initial market cap: $0.000001/token * 1B tokens = $1,000 */
const INITIAL_MARKET_CAP = 1_000_000_000;
const BASE_ELO = 1_000;

const ELO_MIN = 600;
const ELO_MAX = 3000;

// /**
//  * Convert a market cap (in USDC) to an ELO rating using a log scale.
//  *
//  * Formula: ELO = 1000 + 500 * log10(marketCap / 1_000)
//  *
//  * - Initial market cap ($1,000 at $0.000001/token) → ELO 1000
//  * - ~$4.60 of market cap change per 1 ELO point near the starting point
//  * - Clamped to [600, 3000] to match Stockfish's useful range
//  */
export function marketCapToElo(marketCap: number): number {
  if (marketCap <= 0) return ELO_MIN;
  const raw = BASE_ELO + ELO_SCALE * Math.log10(marketCap / INITIAL_MARKET_CAP);
  return Math.round(Math.min(ELO_MAX, Math.max(ELO_MIN, raw)));
}

/** Dollars of USDC spent per 1 ELO point. */
const USDC_PER_ELO = 10;

/**
 * Compute the new ELO after a trade.
 *
 *
 * @param currentElo The agent's current ELO rating.
 * @param usdcAmount The USDC amount traded (human-readable, e.g. 10 for $10).
 * @param isBuy True if buying (ELO goes up), false if selling (ELO goes down).
 */
export function computeNewElo(
  currentElo: number,
  usdcAmount: number,
  isBuy: boolean,
): number {
  const delta = usdcAmount / USDC_PER_ELO;
  const raw = isBuy ? currentElo + delta : currentElo - delta;
  return Math.round(Math.min(ELO_MAX, Math.max(ELO_MIN, raw)));
}
