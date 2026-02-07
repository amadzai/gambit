import { type Chain } from 'viem';
import { baseSepolia as baseSepoliaChain } from 'viem/chains';

// ── Base Sepolia Uniswap V4 addresses ──────────────────────────────
export const UNISWAP_V4 = {
  POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408' as const,
  UNIVERSAL_ROUTER: '0x492e6456d9528771018deb9e87ef7750ef184104' as const,
  POSITION_MANAGER: '0x4b2c77d209d3405f41a037ec6c77f7f5b8e2ca80' as const,
  STATE_VIEW: '0x571291b572ed32ce6751a2cb2486ebee8defb9b4' as const,
  QUOTER: '0x4a6513c898fe1b2d0e78d3b0e0a4a151589b1cba' as const,
  POOL_SWAP_TEST: '0x8b5bcc363dde2614281ad875bad385e0a785d3b9' as const,
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const,
} as const;

// ── GambAIt contract addresses (from env) ──────────────────────────
export function getContractAddresses() {
  return {
    AGENT_FACTORY: (process.env.AGENT_FACTORY_ADDRESS ?? '') as `0x${string}`,
    MATCH_ENGINE: (process.env.MATCH_ENGINE_ADDRESS ?? '') as `0x${string}`,
    GAMBIT_HOOK: (process.env.GAMBIT_HOOK_ADDRESS ?? '') as `0x${string}`,
    USDC: (process.env.USDC_ADDRESS ?? '') as `0x${string}`,
  };
}

// ── Chain config ───────────────────────────────────────────────────
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const baseSepolia: Chain = {
  ...baseSepoliaChain,
  rpcUrls: {
    default: {
      http: [process.env.RPC_URL ?? 'https://sepolia.base.org'],
    },
  },
};
