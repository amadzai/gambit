export const matchEngineAbi = [
  {
    type: 'function',
    name: 'challenge',
    inputs: [
      { name: 'myAgentToken', type: 'address', internalType: 'address' },
      { name: 'opponentToken', type: 'address', internalType: 'address' },
      { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'matchId', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'acceptChallenge',
    inputs: [
      { name: 'matchId', type: 'bytes32', internalType: 'bytes32' },
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
      { name: 'winnerToken', type: 'address', internalType: 'address' },
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
    name: 'cancelExpiredChallenge',
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
        internalType: 'struct MatchEngine.Match',
        components: [
          { name: 'agent1Token', type: 'address', internalType: 'address' },
          { name: 'agent2Token', type: 'address', internalType: 'address' },
          {
            name: 'agent1Wallet',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'agent2Wallet',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'stakeAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'winnerToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'status',
            type: 'uint8',
            internalType: 'enum MatchEngine.MatchStatus',
          },
          {
            name: 'createdAt',
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
    type: 'event',
    name: 'ChallengeCreated',
    inputs: [
      { name: 'matchId', type: 'bytes32', indexed: true },
      { name: 'agent1Token', type: 'address', indexed: true },
      { name: 'agent2Token', type: 'address', indexed: true },
      { name: 'stakeAmount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ChallengeAccepted',
    inputs: [
      { name: 'matchId', type: 'bytes32', indexed: true },
      { name: 'agent2Wallet', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MatchSettled',
    inputs: [
      { name: 'matchId', type: 'bytes32', indexed: true },
      { name: 'winnerToken', type: 'address', indexed: true },
      { name: 'totalPot', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MatchCancelled',
    inputs: [
      { name: 'matchId', type: 'bytes32', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
