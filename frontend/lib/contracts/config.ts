import { baseSepolia } from "wagmi/chains";

/** Default chain for the app (Base Sepolia). */
export const DEFAULT_CHAIN_ID = baseSepolia.id;

/**
 * Contract addresses by chain.
 * App uses Base Sepolia only; use getAddress(chainId, key) in hooks.
 */
const addressesByChain = {
  [baseSepolia.id]: {} as Record<string, `0x${string}`>,
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

export function getAgentFactoryAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_AGENT_FACTORY_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_AGENT_FACTORY_ADDRESS is not set");
  return addr as `0x${string}`;
}

export function getUsdcAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_USDC_ADDRESS is not set");
  return addr as `0x${string}`;
}
