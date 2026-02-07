/**
 * Contract ABIs. Import from your build output (Hardhat/Foundry) or paste ABI here.
 * Use const assertion so wagmi infers types for functionName and args.
 */

// Example: minimal ERC20-style read ABI for balanceOf
export const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Add more ABIs per contract; then use in hooks/contracts/*.ts
export type Erc20Abi = typeof erc20Abi;
