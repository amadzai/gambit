# GambAIt Contract System Overview

## System Architecture

GambAIt is a decentralized AI chess agent battling platform built on Uniswap V4. The system consists of four smart contracts that work together to enable agent creation, trading, and competitive gameplay with economic stakes.

### Contract Components

```
┌──────────────────┐
│   AgentToken     │  Simple ERC20 with 1B fixed supply
└──────────────────┘

┌──────────────────┐
│  AgentFactory    │  Creates agents, deploys tokens, manages Uniswap pools
└────────┬─────────┘
         │
         │ creates & manages
         ▼
┌──────────────────┐       ┌──────────────────┐
│  Uniswap V4 Pool │◄──────│  GambAItHook     │  Fee splitting (3% creator, 2% protocol)
│  (Agent/USDC)    │       └──────────────────┘
└────────┬─────────┘
         │
         │ LP positions (50% user, 50% agent EOA)
         ▼
┌──────────────────┐
│  BattleManager   │  Challenge/accept battles, transfers LP stakes, tracks stats
└──────────────────┘
```

---

## Contract Interactions

### 1. AgentFactory.sol
**Purpose**: Deploys AI agent tokens and creates tradeable markets on Uniswap V4

**Key Features**:
- Deploys ERC20 tokens for each agent
- Creates Uniswap V4 pools (Agent/USDC pairs)
- Splits liquidity 50/50: user LP position + agent EOA LP position
- User and agent each receive their own LP NFT (no tokens sent separately)
- Tracks all agents and their metadata (including agent wallet address)

### 2. BattleManager.sol
**Purpose**: Orchestrates chess battles with economic stakes via challenge/accept flow

**Key Features**:
- Challenge/accept flow: agent EOAs initiate and accept battles
- Agents choose their own stake amounts (no fixed percentage)
- Escrows LP NFTs during battles, returns them after settlement
- Verifies backend-signed results (ECDSA signatures)
- Transfers LP stakes from loser to winner (variable stake per match)
- Enforces cooldowns (1 hour) and timeouts (24 hours)
- Tracks agent win/loss statistics
- Maintains minimum liquidity floor (1e15) to prevent complete draining
- Only the agent's LP is at risk, never the user's

### 3. GambAItHook.sol
**Purpose**: Uniswap V4 hook that splits swap fees

**Key Features**:
- Captures 5% of every swap output
- Splits fees: 3% to agent creator, 2% to protocol treasury
- Accumulates claimable fees per user per currency
- Allows fee claims on-demand

### 4. AgentToken.sol
**Purpose**: Simple ERC20 token for each AI agent

**Key Features**:
- Fixed supply: 1 billion tokens (1e27 wei)
- Minted once at deployment to AgentFactory
- No mint/burn capabilities

---

## User Functions (Called by Frontend/Users)

### Creating an Agent

**Function**: `AgentFactory.createAgent(string name, string symbol, uint256 usdcAmount, address agentWallet)`

**Who calls**: Users who want to create a new AI chess agent

**Requirements**:
- User must have approved `usdcAmount` USDC to AgentFactory
- `usdcAmount` must be >= `creationFee`
- User must have sufficient USDC balance
- `agentWallet` must be a valid non-zero address (the agent's backend-managed EOA)

**What happens**:
1. Transfers USDC from user to factory
2. Deploys new AgentToken with specified name/symbol
3. Creates Uniswap V4 pool (Agent/USDC)
4. Initializes pool at 1:1 price
5. Splits tokens and USDC 50/50
6. Adds user's LP position (50% tokens + 50% USDC) → mints LP NFT to `msg.sender`
7. Adds agent's LP position (50% tokens + 50% USDC) → mints LP NFT to `agentWallet`
8. Emits `AgentCreated` event

**Returns**: Address of the newly created agent token

**Example Flow**:
```solidity
// 1. User approves USDC
usdc.approve(agentFactory, 1000 * 1e6); // 1000 USDC

// 2. User creates agent with agent's EOA wallet
address agentToken = agentFactory.createAgent(
    "ChessGPT Alpha",
    "CGPT",
    1000 * 1e6,   // 1000 USDC for liquidity
    agentEOA      // Backend-managed agent wallet
);
// User receives LP NFT for 50% of liquidity
// Agent EOA receives LP NFT for 50% of liquidity
```

---

### Challenging Another Agent to Battle

**Function**: `BattleManager.challengeAgent(address agent1Token, address agent2Token, uint128 stakeAmount)`

**Who calls**: Agent's EOA wallet (backend-managed key)

**Requirements**:
- Both agents must exist (created via AgentFactory)
- Agents must be different
- Caller must be agent1's `agentWallet`
- Agent1 must have passed cooldown period (1 hour since last match)
- Agent1 must have approved BattleManager for their LP NFT
- Agent1 must have enough liquidity (`stakeAmount + MIN_LIQUIDITY_FLOOR`)

**What happens**:
1. Validates both agents exist and caller is agent1's wallet
2. Checks cooldown period for agent1
3. Verifies agent1 has sufficient liquidity
4. Transfers agent1's LP NFT to BattleManager (escrow)
5. Generates unique `matchId`
6. Creates match record with status `Pending`
7. Emits `ChallengeCreated` event

**Returns**: `bytes32 matchId` for tracking the match

**Example Flow**:
```solidity
// Agent1's EOA wallet challenges Agent2
// First, approve BattleManager for the LP NFT
positionManager.approve(battleManager, agent1PositionId);

bytes32 matchId = battleManager.challengeAgent(
    agentTokenA,  // Challenger's agent token
    agentTokenB,  // Opponent's agent token
    1e16          // Amount of liquidity to stake
);
```

---

### Accepting a Challenge

**Function**: `BattleManager.acceptChallenge(bytes32 matchId, uint128 stakeAmount)`

**Who calls**: Agent2's EOA wallet (backend-managed key)

**Requirements**:
- Match must exist and be in `Pending` status
- Challenge must not have expired (< 24 hours)
- Caller must be agent2's `agentWallet`
- Agent2 must have passed cooldown period
- Agent2 must have approved BattleManager for their LP NFT
- Agent2 must have enough liquidity

**What happens**:
1. Validates match is pending and caller is agent2's wallet
2. Checks cooldown period for agent2
3. Verifies agent2 has sufficient liquidity
4. Transfers agent2's LP NFT to BattleManager (escrow)
5. Updates match with agent2's stake and status → `InProgress`
6. Emits `ChallengeAccepted` event

**Example Flow**:
```solidity
// Agent2's EOA wallet accepts the challenge
positionManager.approve(battleManager, agent2PositionId);

battleManager.acceptChallenge(
    matchId,  // From ChallengeCreated event
    2e16      // Agent2's stake amount (can differ from agent1's)
);
```

---

### Declining a Challenge

**Function**: `BattleManager.declineChallenge(bytes32 matchId)`

**Who calls**: Either agent's EOA wallet or the result signer

**Requirements**:
- Match must exist and be in `Pending` status
- Caller must be agent1's wallet, agent2's wallet, or the result signer

**What happens**:
1. Returns agent1's escrowed LP NFT to agent1's wallet
2. Sets match status to `Cancelled`
3. Emits `MatchCancelled` event

---

### Claiming Swap Fees

**Function**: `GambAItHook.claim(Currency currency)`

**Who calls**: Agent creators and protocol treasury to claim accumulated fees

**Requirements**:
- Caller must have claimable fees > 0 for the specified currency

**What happens**:
1. Reads accumulated fees for caller
2. Resets claimable balance to 0
3. Transfers tokens from PoolManager to claimer
4. Emits `FeesClaimed` event

**Example Flow**:
```solidity
// Check claimable amount first
uint256 claimableUSDC = hook.getClaimable(msg.sender, Currency.wrap(usdc));

// Claim if > 0
if (claimableUSDC > 0) {
    hook.claim(Currency.wrap(usdc));
}
```

---

### View Functions (Read-Only)

**AgentFactory**:
- `getMarketCap(address agentToken)` - Returns estimated market cap in USDC
- `getAllAgents()` - Returns array of all agent token addresses
- `getAgentInfo(address tokenAddress)` - Returns agent metadata (name, symbol, creator, agentWallet, userPositionId, agentPositionId, etc.)

**BattleManager**:
- `getMatch(bytes32 matchId)` - Returns match details (agents, winner, stakes, accepted status, timestamps)
- `getAllMatches()` - Returns array of all match IDs
- `getAgentStats(address agent)` - Returns wins, losses, total matches

**GambAItHook**:
- `getClaimable(address account, Currency currency)` - Returns claimable fee amount

---

## Protocol Wallet Functions (Called by Backend)

The protocol wallet is a backend-controlled address that signs match results and manages settlements. Agent EOA wallets are also backend-managed keys that initiate/accept challenges.

### Setting the Result Signer (Initial Setup)

**Function**: `BattleManager.setResultSigner(address _resultSigner)`

**Who calls**: Contract owner (one-time setup)

**Purpose**: Authorize the backend wallet address that can sign match results

---

### Settling a Match (After Chess Game Completes)

**Function**: `BattleManager.settleMatch(bytes32 matchId, address winner, bytes signature)`

**Who calls**: Anyone (but requires valid backend signature)

**Requirements**:
- Valid backend signature from `resultSigner`
- Match must exist and be `InProgress`
- Winner must be one of the two agents in the match
- Match must not have timed out (< 24 hours)
- Signature must not have been used before (replay protection)

**Signature Format**:
```javascript
// Backend generates signature
const messageHash = ethers.solidityPackedKeccak256(
    ['bytes32', 'address', 'uint256', 'address'],
    [matchId, winner, chainId, battleManagerAddress]
);
const signature = await backendWallet.signMessage(ethers.getBytes(messageHash));
```

**What happens**:
1. Verifies ECDSA signature from backend
2. Marks signature as used (prevents replay)
3. Determines loser
4. Executes LP stake transfer (loser's staked amount transferred to winner):
   - Decreases loser's agent LP position by their staked amount
   - Swaps loser's agent tokens to USDC
   - Increases winner's agent LP position with USDC
5. Returns both LP NFTs to their respective agent EOA wallets
6. Updates agent statistics (wins/losses)
7. Sets match status to `Completed`
8. Emits `MatchSettled` event

**Example Backend Code**:
```javascript
// After chess game completes on backend
const matchId = "0x1234..."; // From ChallengeAccepted event
const winner = agentTokenA;  // Determined by chess engine

// Generate signature
const messageHash = ethers.solidityPackedKeccak256(
    ['bytes32', 'address', 'uint256', 'address'],
    [matchId, winner, chainId, battleManagerAddress]
);
const signature = await protocolWallet.signMessage(ethers.getBytes(messageHash));

// Submit to contract (can be called by anyone, including backend relayer)
await battleManager.settleMatch(matchId, winner, signature);
```

---

### Cancelling a Match

**Function**: `BattleManager.cancelMatch(bytes32 matchId, bytes signature)`

**Who calls**: Anyone (but requires valid backend signature)

**Requirements**:
- Valid backend signature from `resultSigner`
- Match must exist and not be `Completed` or `Cancelled`
- Signature must not have been used before

**Signature Format**:
```javascript
const messageHash = ethers.solidityPackedKeccak256(
    ['bytes32', 'string', 'uint256', 'address'],
    [matchId, 'cancel', chainId, battleManagerAddress]
);
const signature = await backendWallet.signMessage(ethers.getBytes(messageHash));
```

**What happens**:
1. Verifies ECDSA signature
2. Returns escrowed LP NFTs to their respective agent wallets
3. Sets match status to `Cancelled`
4. No LP transfers occur
5. Emits `MatchCancelled` event

**Use Cases**:
- Game crashed or had technical issues
- Invalid game state detected
- Players disconnected

---

### Cancelling Expired Matches (No Signature Required)

**Function**: `BattleManager.cancelExpiredMatch(bytes32 matchId)`

**Who calls**: Anyone (permissionless)

**Requirements**:
- Match must be `Pending` or `InProgress`
- Match must be older than 24 hours

**What happens**:
- Returns escrowed LP NFTs to their respective agent wallets
- Sets match status to `Cancelled`
- No LP transfers occur

**Use Cases**:
- Cleanup of stalled matches or unanswered challenges
- Backend failed to submit result

---

## Admin Functions (Contract Owner Only)

### AgentFactory
- `setBattleManager(address _battleManager)` - Set BattleManager address
- `setCreationFee(uint256 _creationFee)` - Update agent creation fee
- `setHookAddress(address _hookAddress)` - Set hook address for pools

### BattleManager
- `setResultSigner(address _resultSigner)` - Update authorized signer
- `sweepTokens(address token, address to)` - Emergency token recovery

### GambAItHook
- `setTreasury(address _treasury)` - Update protocol treasury address

---

## Complete User Journey Examples

### Journey 1: Creating and Trading an Agent

```solidity
// 1. User creates agent with an agent EOA wallet
usdc.approve(agentFactory, 1000e6);
address myAgent = agentFactory.createAgent("AlphaChess", "ALPHA", 1000e6, agentEOA);
// User receives LP NFT for 50% of liquidity (can withdraw anytime)
// Agent EOA receives LP NFT for 50% of liquidity (managed by backend)

// 2. Other users can now trade on Uniswap V4
// Frontend shows pool: ALPHA/USDC
// Users swap USDC for ALPHA tokens (or vice versa)

// 3. Every swap generates fees:
//    - 5% of output goes to hook
//    - 3% accumulates for agent creator
//    - 2% accumulates for protocol

// 4. Creator claims fees
uint256 claimable = hook.getClaimable(msg.sender, Currency.wrap(usdc));
hook.claim(Currency.wrap(usdc)); // Receives USDC fees
```

### Journey 2: Battling Two Agents (Challenge/Accept Flow)

```javascript
// 1. Agent1's EOA wallet challenges Agent2 (backend initiates)
await positionManager.approve(battleManager.address, agent1PositionId);
const tx1 = await battleManager.challengeAgent(agentA, agentB, stakeAmount1);
// Agent1's LP NFT is escrowed in BattleManager
// Match status: Pending

// 2. Agent2's EOA wallet accepts the challenge (backend responds)
await positionManager.approve(battleManager.address, agent2PositionId);
const tx2 = await battleManager.acceptChallenge(matchId, stakeAmount2);
// Agent2's LP NFT is escrowed in BattleManager
// Match status: InProgress

// 3. Backend runs chess game between agents
//    - Agents play chess using AI engines
//    - Game completes with winner = agentA

// 4. Backend signs and submits result
const messageHash = ethers.solidityPackedKeccak256(
    ['bytes32', 'address', 'uint256', 'address'],
    [matchId, agentA, chainId, battleManagerAddress]
);
const signature = await protocolWallet.signMessage(ethers.getBytes(messageHash));
await battleManager.settleMatch(matchId, agentA, signature);

// 5. Settlement executes:
//    - Loser's staked liquidity is removed from their agent LP
//    - Tokens swapped to USDC
//    - USDC added to winner's agent LP
//    - Both LP NFTs returned to their respective agent EOA wallets
//    - Winner's market cap increases, loser's decreases

// 6. Stats update:
//    - agentA: wins++
//    - agentB: losses++
```

---

## Security Considerations

### Signature Replay Protection
- `usedSignatures` mapping prevents reusing signatures
- Each signature is marked as used immediately after verification

### Match Cooldowns
- 1-hour cooldown prevents spam and manipulation
- Ensures agents can't be drained too quickly

### Minimum Liquidity Floor
- `MIN_LIQUIDITY_FLOOR = 1e15` ensures agents always have some liquidity
- Prevents complete LP draining
- Enforced both at challenge time and at settlement

### Match Timeouts
- 24-hour timeout for settling matches
- Prevents locked matches from blocking agent participation
- Anyone can cancel expired matches (returns escrowed NFTs)

### LP NFT Escrow
- Agent LP NFTs are held by BattleManager during active matches
- Prevents agents from withdrawing liquidity mid-battle
- NFTs are always returned after settlement or cancellation

### User LP Protection
- User's LP position is never at risk in battles
- Only the agent's LP (managed by backend EOA) participates in stakes
- Users can withdraw their LP anytime via Uniswap PositionManager

### Access Controls
- Only agent EOA wallets can challenge/accept battles
- Only owner can update critical addresses (signer, treasury, fees)
- Only PoolManager can call hook functions

---

## Key Constants

### AgentFactory
- `USER_LP_PERCENTAGE = 5000` (50% of tokens+USDC to user LP)
- `AGENT_LP_PERCENTAGE = 5000` (50% of tokens+USDC to agent LP)
- `POOL_FEE = 3000` (0.3% Uniswap fee)
- `TICK_SPACING = 60`

### BattleManager
- `MIN_LIQUIDITY_FLOOR = 1e15`
- `MATCH_COOLDOWN = 1 hours`
- `MATCH_TIMEOUT = 24 hours`
- Stake amounts are variable (chosen by agents per challenge)

### GambAItHook
- `CREATOR_FEE_BPS = 300` (3% of swap output)
- `PROTOCOL_FEE_BPS = 200` (2% of swap output)
- `TOTAL_FEE_BPS = 500` (5% total)

### AgentToken
- `TOTAL_SUPPLY = 1_000_000_000 * 10**18` (1 billion tokens)

---

## Event Monitoring

### AgentFactory Events
```solidity
event AgentCreated(address indexed tokenAddress, string name, string symbol, address indexed creator, address indexed agentWallet, uint256 userPositionId, uint256 agentPositionId, uint256 usdcAmount)
```

### BattleManager Events
```solidity
event ChallengeCreated(bytes32 indexed matchId, address indexed agent1, address indexed agent2, uint128 agent1Stake, uint256 timestamp)
event ChallengeAccepted(bytes32 indexed matchId, address indexed agent2, uint128 agent2Stake, uint256 timestamp)
event MatchSettled(bytes32 indexed matchId, address indexed winner, address indexed loser, uint256 timestamp)
event MatchCancelled(bytes32 indexed matchId, uint256 timestamp)
```

### GambAItHook Events
```solidity
event FeesAccumulated(address indexed recipient, Currency indexed currency, uint256 amount)
event FeesClaimed(address indexed claimer, Currency indexed currency, uint256 amount)
```

---

## Deployment Checklist

1. **Deploy Contracts**:
   ```
   1. Deploy MockUSDC (testnet) or use real USDC (mainnet)
   2. Deploy AgentFactory(usdc, poolManager, positionManager, creationFee)
   3. Deploy GambAItHook(poolManager, agentFactory, usdc, treasury)
   4. Deploy BattleManager(agentFactory, poolManager, positionManager, resultSigner)
   ```

2. **Configure Contracts**:
   ```
   1. AgentFactory.setHookAddress(gambAItHook)
   2. AgentFactory.setBattleManager(battleManager)
   ```

3. **Generate Backend Wallets**:
   ```
   1. Create dedicated wallet for result signing (resultSigner)
   2. Create EOA wallets for each agent (agentWallet)
   3. Note down private keys securely
   4. Set resultSigner in BattleManager
   ```

4. **Set Treasury Address**:
   ```
   1. GambAItHook.setTreasury(protocolTreasuryAddress)
   ```

---

## Integration Guide for Frontend

### Essential Contract Calls

**Display All Agents**:
```javascript
const agents = await agentFactory.getAllAgents();
for (const agentAddress of agents) {
    const info = await agentFactory.getAgentInfo(agentAddress);
    const marketCap = await agentFactory.getMarketCap(agentAddress);
    const stats = await battleManager.getAgentStats(agentAddress);
    // Display: name, symbol, creator, agentWallet, marketCap, wins, losses
}
```

**Create Agent Form**:
```javascript
// User inputs: name, symbol, usdcAmount
// Backend provides: agentWallet (EOA address for the agent)
await usdc.approve(agentFactory.address, usdcAmount);
const tx = await agentFactory.createAgent(name, symbol, usdcAmount, agentWallet);
const receipt = await tx.wait();
// Parse AgentCreated event for new token address, userPositionId, agentPositionId
```

**Monitor Match Status**:
```javascript
const match = await battleManager.getMatch(matchId);
// match.status: 0=Pending, 1=InProgress, 2=Completed, 3=Cancelled
// match.agent1Stake, match.agent2Stake: stake amounts
// match.agent2Accepted: whether agent2 has accepted
```

**Claim Fees**:
```javascript
const claimable = await hook.getClaimable(userAddress, usdcCurrency);
if (claimable > 0) {
    await hook.claim(usdcCurrency);
}
```

---

## Integration Guide for Backend

### Agent Wallet Management

Each agent has a dedicated EOA wallet managed by the backend. This wallet:
- Receives the agent's LP NFT at creation
- Initiates and accepts battle challenges
- Must approve BattleManager before challenging/accepting

### Battle Flow (Challenge/Accept)

1. **Agent1's backend decides to challenge**:
```javascript
// Approve BattleManager for agent1's LP NFT
await positionManager.connect(agent1Wallet).approve(battleManager.address, agent1PositionId);

// Challenge agent2
const tx = await battleManager.connect(agent1Wallet).challengeAgent(
    agent1Token, agent2Token, stakeAmount
);
const receipt = await tx.wait();
// Parse ChallengeCreated event for matchId
```

2. **Agent2's backend decides to accept**:
```javascript
// Approve BattleManager for agent2's LP NFT
await positionManager.connect(agent2Wallet).approve(battleManager.address, agent2PositionId);

// Accept challenge
await battleManager.connect(agent2Wallet).acceptChallenge(matchId, agent2StakeAmount);
// Match is now InProgress — start the chess game
```

3. **Listen for ChallengeAccepted events and run chess game**:
```javascript
battleManager.on('ChallengeAccepted', async (matchId, agent2, agent2Stake, timestamp) => {
    const match = await battleManager.getMatch(matchId);
    const gameResult = await runChessGame(match.agent1, match.agent2);

    if (gameResult.winner) {
        const signature = await signMatchResult(matchId, gameResult.winner);
        await battleManager.settleMatch(matchId, gameResult.winner, signature);
    } else {
        const signature = await signMatchCancellation(matchId);
        await battleManager.cancelMatch(matchId, signature);
    }
});
```

4. **Sign match results**:
```javascript
async function signMatchResult(matchId, winner) {
    const messageHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'address', 'uint256', 'address'],
        [matchId, winner, chainId, battleManager.address]
    );
    return await backendWallet.signMessage(ethers.getBytes(messageHash));
}
```

5. **Sign cancellations**:
```javascript
async function signMatchCancellation(matchId) {
    const messageHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'string', 'uint256', 'address'],
        [matchId, 'cancel', chainId, battleManager.address]
    );
    return await backendWallet.signMessage(ethers.getBytes(messageHash));
}
```

6. **Decline challenges**:
```javascript
// Agent2's backend can decline if it doesn't want to battle
await battleManager.connect(agent2Wallet).declineChallenge(matchId);
// Agent1's LP NFT is returned
```

---

## Troubleshooting

### Common Issues

**"Agent cooldown" error**:
- Each agent can only battle once per hour
- Wait until `lastMatchTimestamp[agent] + 1 hour` has passed

**"NotAgentWallet" error**:
- Only the agent's registered EOA wallet can challenge/accept battles
- Verify you're calling from the correct wallet address

**"InsufficientLiquidity" error**:
- Agent doesn't have enough liquidity to cover `stakeAmount + MIN_LIQUIDITY_FLOOR`
- Reduce the stake amount or wait for liquidity to increase

**"MatchNotPending" error**:
- Challenge has already been accepted, declined, or expired
- Check match status before accepting/declining

**"Invalid signature" error**:
- Verify signature is generated with correct format
- Ensure `resultSigner` address matches backend wallet
- Check chainId matches deployment chain

**"Match expired" / "Challenge expired" error**:
- Match/challenge must be acted on within 24 hours
- Use `cancelExpiredMatch` to clean up and return escrowed NFTs

**"InsufficientUSDC" error**:
- User hasn't approved enough USDC to AgentFactory
- User's USDC balance is too low
- Ensure `usdcAmount >= creationFee`

---

## Gas Optimization Notes

- LP transfers involve multiple operations (decrease, swap, increase) and consume significant gas
- Challenge/accept flow requires two transactions before the game starts (plus NFT approvals)
- Consider batching multiple claim operations
- Full-range liquidity positions simplify calculations but may not be capital efficient
- Hook execution adds overhead to every swap

---

## Future Improvements

Potential enhancements (not currently implemented):
- Minimum/maximum stake limits configurable by admin
- Multiple battle formats (tournaments, leagues)
- Agent leveling system tied to wins
- Concentrated liquidity positions (custom tick ranges)
- Dynamic fee tiers based on agent popularity
- Governance for protocol parameters
- Automated matchmaking (backend selects opponents and stake amounts)
