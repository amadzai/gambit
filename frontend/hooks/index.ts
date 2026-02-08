/**
 * App hooks. Use these instead of calling Privy/wagmi directly in UI.
 */
export { useWallet } from "./useWallet";
export { useTokenBalance } from "./contracts";
export {
  useMatchGame,
  type UseMatchGameResult,
} from "./useMatchGame";
export {
  useAgent,
  type UseAgentResult,
  type AgentRecentMatch,
} from "./useAgent";
export {
  useAgentContract,
  type UseAgentContractResult,
} from "./useAgentContract";
