export const battleManagerAbi = [
  {
    type: 'function',
    name: 'challengeAgent',
    inputs: [
      { name: 'agent1Token', type: 'address', internalType: 'address' },
      { name: 'agent2Token', type: 'address', internalType: 'address' },
      { name: 'stakeAmount', type: 'uint128', internalType: 'uint128' },
    ],
    outputs: [{ name: 'matchId', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'acceptChallenge',
    inputs: [
      { name: 'matchId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'stakeAmount', type: 'uint128', internalType: 'uint128' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'declineChallenge',
    inputs: [{ name: 'matchId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'settleMatch',
    inputs: [
      { name: 'matchId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'winner', type: 'address', internalType: 'address' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelMatch',
    inputs: [
      { name: 'matchId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelExpiredMatch',
    inputs: [{ name: 'matchId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getMatch',
    inputs: [{ name: 'matchId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct BattleManager.Match',
        components: [
          { name: 'matchId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'agent1', type: 'address', internalType: 'address' },
          { name: 'agent2', type: 'address', internalType: 'address' },
          { name: 'winner', type: 'address', internalType: 'address' },
          {
            name: 'agent1Stake',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'agent2Stake',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'agent2Accepted',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'status',
            type: 'uint8',
            internalType: 'enum BattleManager.MatchStatus',
          },
          {
            name: 'createdAt',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'settledAt',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAllMatches',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32[]', internalType: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAgentStats',
    inputs: [{ name: 'agent', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct BattleManager.AgentStats',
        components: [
          { name: 'wins', type: 'uint256', internalType: 'uint256' },
          { name: 'losses', type: 'uint256', internalType: 'uint256' },
          {
            name: 'totalMatches',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const;
