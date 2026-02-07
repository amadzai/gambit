"use client";

import { useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/contracts/abis";
import { getContractAddress, DEFAULT_CHAIN_ID } from "@/lib/contracts/config";

/**
 * Example: contract-specific hook that encapsulates address + ABI + read.
 * App uses Base Sepolia only; reads always target DEFAULT_CHAIN_ID.
 */
export function useTokenBalance(
  contractKey: string,
  accountAddress: `0x${string}` | undefined,
) {
  const address = getContractAddress(DEFAULT_CHAIN_ID, contractKey);

  const read = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: accountAddress ? [accountAddress] : undefined,
    chainId: DEFAULT_CHAIN_ID,
  });

  return {
    balance: read.data,
    isLoading: read.isLoading,
    isError: read.isError,
    error: read.error,
    refetch: read.refetch,
  };
}
