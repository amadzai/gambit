export const gambitHookAbi = [
  {
    type: 'function',
    name: 'claim',
    inputs: [{ name: 'currency', type: 'address', internalType: 'Currency' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getClaimable',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'currency', type: 'address', internalType: 'Currency' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
