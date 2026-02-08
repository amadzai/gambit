import { createConfig } from "@privy-io/wagmi";
import { baseSepolia, mainnet } from "wagmi/chains";
import { http } from "wagmi";

// Default chain for the app: Base Sepolia only
export const defaultChain = baseSepolia;

// Use createConfig from @privy-io/wagmi (not wagmi) so Privy drives wagmi's connectors
// mainnet is included solely for ENS name resolution
export const wagmiConfig = createConfig({
  chains: [baseSepolia, mainnet],
  transports: {
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
