"use client";

import { useChainId } from "wagmi";
import { useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/config";

/**
 * Example: contract-specific hook that encapsulates address + ABI + read.
 * Use this pattern per contract or per read (e.g. useTokenBalance, useAllowance).
 * For writes, use useWriteContract in a similar hook or in the component.
 */
export function useTokenBalance(
  contractKey: string,
  accountAddress: `0x${string}` | undefined,
) {
  const chainId = useChainId();
  const address = getContractAddress(chainId, contractKey);

  const read = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: accountAddress ? [accountAddress] : undefined,
  });

  return {
    balance: read.data,
    isLoading: read.isLoading,
    isError: read.isError,
    error: read.error,
    refetch: read.refetch,
  };
}
