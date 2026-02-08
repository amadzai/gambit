import type { PrivyClientConfig } from "@privy-io/react-auth";
import { baseSepolia } from "wagmi/chains";

// Default and only chain: Base Sepolia (must match wagmiConfig)
export const privyConfig: PrivyClientConfig = {
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia],
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    showWalletUIs: true,
  },
  loginMethods: ["wallet", "email", "sms"],
  appearance: {
    showWalletLoginFirst: true,
    theme: "#000000",
    accentColor: "#4a3426",
    logo: "/gambitWhite.png",
  },
};
