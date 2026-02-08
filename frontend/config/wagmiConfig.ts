import { createConfig } from "@privy-io/wagmi";
import { baseSepolia } from "wagmi/chains";
import { http } from "wagmi";

// Default chain for the app: Base Sepolia only
export const defaultChain = baseSepolia;

// Use createConfig from @privy-io/wagmi (not wagmi) so Privy drives wagmi's connectors
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});
