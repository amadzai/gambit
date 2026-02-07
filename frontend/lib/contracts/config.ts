import { mainnet, sepolia } from "wagmi/chains";

/**
 * Contract addresses by chain.
 * Add your deployed contract addresses here; use getAddress(chainId, key) in hooks.
 */
const addressesByChain = {
  [mainnet.id]: {} as Record<string, `0x${string}`>,
  [sepolia.id]: {} as Record<string, `0x${string}`>,
};

export const contractAddresses = addressesByChain;

export type ChainId = keyof typeof contractAddresses;

export function getContractAddress(
  chainId: number,
  key: string,
): `0x${string}` | undefined {
  const chain = contractAddresses[chainId as ChainId];
  if (!chain) return undefined;
  return chain[key];
}
