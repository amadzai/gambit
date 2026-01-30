import type { PrivyClientConfig } from "@privy-io/react-auth";

// Chains here should match wagmiConfig chains (supportedChains)
export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    showWalletUIs: true,
  },
  loginMethods: ["wallet", "email", "sms"],
  appearance: {
    showWalletLoginFirst: true,
  },
};
