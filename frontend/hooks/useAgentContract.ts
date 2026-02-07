'use client';

import { useMemo, useCallback, useState } from 'react';
import { useReadContract, useWriteContract, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { parseUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useWallet } from './useWallet';
import { erc20Abi, stateViewAbi, poolSwapTestAbi } from '@/lib/contracts/abis';
import {
  getUniswapAddresses,
  getPoolKey,
  computePoolId,
  getAgentTokenPrice,
  isBuyZeroForOne,
  AGENT_TOKEN_TOTAL_SUPPLY,
  TOKEN_DECIMALS,
  MIN_SQRT_PRICE_LIMIT,
  MAX_SQRT_PRICE_LIMIT,
} from '@/lib/contracts/uniswap';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseAgentContractResult {
  /** Agent token price in USDC (human-readable). Null while loading or if unavailable. */
  price: number | null;
  /** Market cap in USDC (price * total supply). Null while loading. */
  marketCap: number | null;
  /** User's agent-token balance (human-readable, 6dp). Null if wallet not connected. */
  holdings: number | null;
  /** Whether the price is currently loading. */
  isLoadingPrice: boolean;
  /** Whether the holdings balance is loading. */
  isLoadingHoldings: boolean;
  /** Execute a buy (USDC → AgentToken). `amount` is USDC as a string (e.g. "10"). */
  buy: (amount: string) => Promise<void>;
  /** Execute a sell (AgentToken → USDC). `amount` is token count as a string (e.g. "5"). */
  sell: (amount: string) => Promise<void>;
  /** True while a buy transaction is in progress. */
  isBuying: boolean;
  /** True while a sell transaction is in progress. */
  isSelling: boolean;
  /** Refetch price and holdings. */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAgentContract(
  tokenAddress: string | null | undefined,
): UseAgentContractResult {
  const { address: userAddress } = useWallet();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);

  const addresses = useMemo(() => getUniswapAddresses(), []);

  // ── Derived pool data ─────────────────────────────────────────────
  const tokenAddr = tokenAddress as `0x${string}` | undefined;
  const hasToken = !!tokenAddr && tokenAddr !== '0x';

  const poolKey = useMemo(() => {
    if (!hasToken) return null;
    return getPoolKey(tokenAddr!, addresses.usdc, addresses.gambitHook);
  }, [hasToken, tokenAddr, addresses.usdc, addresses.gambitHook]);

  const poolId = useMemo(() => {
    if (!poolKey) return null;
    return computePoolId(poolKey);
  }, [poolKey]);

  // ── Read: pool slot0 (price) ──────────────────────────────────────
  const {
    data: slot0Data,
    isLoading: isLoadingPrice,
    refetch: refetchPrice,
  } = useReadContract({
    address: addresses.stateView,
    abi: stateViewAbi,
    functionName: 'getSlot0',
    args: poolId ? [poolId] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!poolId },
  });

  const price = useMemo(() => {
    if (!slot0Data || !hasToken) return null;
    const sqrtPriceX96 = slot0Data[0] as bigint;
    if (sqrtPriceX96 === BigInt(0)) return null;
    return getAgentTokenPrice(sqrtPriceX96, tokenAddr!, addresses.usdc);
  }, [slot0Data, hasToken, tokenAddr, addresses.usdc]);

  const marketCap = useMemo(() => {
    if (price == null) return null;
    return price * AGENT_TOKEN_TOTAL_SUPPLY;
  }, [price]);

  // ── Read: user's agent-token balance ──────────────────────────────
  const {
    data: rawBalance,
    isLoading: isLoadingHoldings,
    refetch: refetchBalance,
  } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: hasToken && !!userAddress },
  });

  const holdings = useMemo(() => {
    if (rawBalance == null) return null;
    return Number(rawBalance) / 10 ** TOKEN_DECIMALS;
  }, [rawBalance]);

  // ── Refetch helper ────────────────────────────────────────────────
  const refetch = useCallback(() => {
    refetchPrice();
    refetchBalance();
  }, [refetchPrice, refetchBalance]);

  // ── Buy: USDC → AgentToken ────────────────────────────────────────
  const buy = useCallback(
    async (amount: string) => {
      if (!poolKey || !hasToken) throw new Error('Pool not ready');
      setIsBuying(true);
      try {
        const rawAmount = parseUnits(amount, TOKEN_DECIMALS); // USDC is 6dp

        // 1. Approve USDC to PoolSwapTest
        const approveTx = await writeContractAsync({
          address: addresses.usdc,
          abi: erc20Abi,
          functionName: 'approve',
          args: [addresses.poolSwapTest, rawAmount],
          chainId: baseSepolia.id,
        });
        await waitForTransactionReceipt(config, { hash: approveTx });

        // 2. Execute swap
        const zeroForOne = isBuyZeroForOne(tokenAddr!, addresses.usdc);
        await writeContractAsync({
          address: addresses.poolSwapTest,
          abi: poolSwapTestAbi,
          functionName: 'swap',
          args: [
            // PoolKey
            {
              currency0: poolKey.currency0,
              currency1: poolKey.currency1,
              fee: poolKey.fee,
              tickSpacing: poolKey.tickSpacing,
              hooks: poolKey.hooks,
            },
            // SwapParams (negative amountSpecified = exact input)
            {
              zeroForOne,
              amountSpecified: -rawAmount,
              sqrtPriceLimitX96: zeroForOne
                ? MIN_SQRT_PRICE_LIMIT
                : MAX_SQRT_PRICE_LIMIT,
            },
            // TestSettings
            { takeClaims: false, settleUsingBurn: false },
            // hookData
            '0x' as `0x${string}`,
          ],
          chainId: baseSepolia.id,
        });

        // 3. Refetch balances
        refetch();
      } finally {
        setIsBuying(false);
      }
    },
    [
      poolKey,
      hasToken,
      tokenAddr,
      addresses,
      writeContractAsync,
      config,
      refetch,
    ],
  );

  // ── Sell: AgentToken → USDC ───────────────────────────────────────
  const sell = useCallback(
    async (amount: string) => {
      if (!poolKey || !hasToken) throw new Error('Pool not ready');
      setIsSelling(true);
      try {
        const rawAmount = parseUnits(amount, TOKEN_DECIMALS); // AgentToken is 6dp

        // 1. Approve AgentToken to PoolSwapTest
        const approveTx = await writeContractAsync({
          address: tokenAddr!,
          abi: erc20Abi,
          functionName: 'approve',
          args: [addresses.poolSwapTest, rawAmount],
          chainId: baseSepolia.id,
        });
        await waitForTransactionReceipt(config, { hash: approveTx });

        // 2. Execute swap (reversed direction)
        const zeroForOne = !isBuyZeroForOne(tokenAddr!, addresses.usdc);
        await writeContractAsync({
          address: addresses.poolSwapTest,
          abi: poolSwapTestAbi,
          functionName: 'swap',
          args: [
            {
              currency0: poolKey.currency0,
              currency1: poolKey.currency1,
              fee: poolKey.fee,
              tickSpacing: poolKey.tickSpacing,
              hooks: poolKey.hooks,
            },
            {
              zeroForOne,
              amountSpecified: -rawAmount,
              sqrtPriceLimitX96: zeroForOne
                ? MIN_SQRT_PRICE_LIMIT
                : MAX_SQRT_PRICE_LIMIT,
            },
            { takeClaims: false, settleUsingBurn: false },
            '0x' as `0x${string}`,
          ],
          chainId: baseSepolia.id,
        });

        refetch();
      } finally {
        setIsSelling(false);
      }
    },
    [
      poolKey,
      hasToken,
      tokenAddr,
      addresses,
      writeContractAsync,
      config,
      refetch,
    ],
  );

  return {
    price,
    marketCap,
    holdings,
    isLoadingPrice,
    isLoadingHoldings,
    isBuying,
    isSelling,
    buy,
    sell,
    refetch,
  };
}
