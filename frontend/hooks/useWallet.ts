"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnection,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

/**
 * Composed wallet hook: Privy (auth) + wagmi (chain/account).
 * Use this in UI instead of calling usePrivy + useAccount separately.
 */
export function useWallet() {
  const privy = usePrivy();
  const setActiveWallet = useSetActiveWallet();
  const connection = useConnection();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address: connection.address,
  });
  const switchChain = useSwitchChain();

  return {
    // Auth (Privy)
    login: privy.login,
    logout: privy.logout,
    authenticated: privy.authenticated,
    ready: privy.ready,
    user: privy.user,

    // Account (wagmi)
    address: connection.address,
    addresses: connection.addresses,
    isConnected: connection.isConnected,
    isConnecting: connection.isConnecting,
    isReconnecting: connection.isReconnecting,
    status: connection.status,

    // Chain
    chainId,
    switchChain: connection.connector?.switchChain,

    // Balance (value is bigint; use decimals/symbol to format)
    balance: balance?.value,
    balanceDecimals: balance?.decimals,
    symbol: balance?.symbol,

    setActiveWallet,
  };
}
