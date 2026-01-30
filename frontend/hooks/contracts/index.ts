/**
 * Contract hooks. Add one hook per contract or per read/write group.
 * - Read: useReadContract({ address, abi, functionName, args }) or a wrapper like useTokenBalance.
 * - Write: useWriteContract() in component, or wrap in useTokenTransfer(contractKey) that returns writeContract.writeContract.
 */
export { useTokenBalance } from "./useTokenBalance";
