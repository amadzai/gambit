import { createConfig } from "@privy-io/wagmi";
import { mainnet, sepolia, baseSepolia } from "wagmi/chains";
import { http } from "wagmi";

// Use createConfig from @privy-io/wagmi (not wagmi) so Privy drives wagmi's connectors
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});
