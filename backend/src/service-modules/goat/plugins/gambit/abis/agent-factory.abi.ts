export const agentFactoryAbi = [
  {
    type: 'function',
    name: 'createAgent',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
      { name: 'usdcAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'agentWallet', type: 'address', internalType: 'address' },
    ],
    outputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getMarketCap',
    inputs: [{ name: 'agentToken', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAllAgents',
    inputs: [],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAgentInfo',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct AgentFactory.AgentInfo',
        components: [
          {
            name: 'tokenAddress',
            type: 'address',
            internalType: 'address',
          },
          { name: 'name', type: 'string', internalType: 'string' },
          { name: 'symbol', type: 'string', internalType: 'string' },
          { name: 'creator', type: 'address', internalType: 'address' },
          {
            name: 'agentWallet',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'userPositionId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'agentPositionId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'createdAt',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'exists', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'AgentCreated',
    inputs: [
      { name: 'tokenAddress', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'agentWallet', type: 'address', indexed: true },
      { name: 'userPositionId', type: 'uint256', indexed: false },
      { name: 'agentPositionId', type: 'uint256', indexed: false },
      { name: 'usdcAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'buyOwnToken',
    inputs: [
      { name: 'agentToken', type: 'address', internalType: 'address' },
      { name: 'usdcAmount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
