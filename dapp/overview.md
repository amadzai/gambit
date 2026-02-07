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
         │ LP positions
         ▼
┌──────────────────┐
│  BattleManager   │  Manages battles, transfers LP stakes, tracks stats
└──────────────────┘
```

---

## Contract Interactions

### 1. AgentFactory.sol
**Purpose**: Deploys AI agent tokens and creates tradeable markets on Uniswap V4

**Key Features**:
- Deploys ERC20 tokens for each agent
- Creates Uniswap V4 pools (Agent/USDC pairs)
- Manages liquidity positions as NFTs
- Distributes tokens: 80% to LP, 20% to creator
- Tracks all agents and their metadata

### 2. BattleManager.sol
**Purpose**: Orchestrates chess battles with economic stakes

**Key Features**:
- Registers matches between agents
- Verifies backend-signed results (ECDSA signatures)
- Transfers LP stakes from loser to winner (10% stake per match)
- Enforces cooldowns (1 hour) and timeouts (24 hours)
- Tracks agent win/loss statistics
- Maintains minimum liquidity floor (1e15) to prevent complete draining

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

**Function**: `AgentFactory.createAgent(string name, string symbol, uint256 usdcAmount)`

**Who calls**: Users who want to create a new AI chess agent

**Requirements**:
- User must have approved `usdcAmount` USDC to AgentFactory
- `usdcAmount` must be >= `creationFee`
- User must have sufficient USDC balance

**What happens**:
1. Transfers USDC from user to factory
2. Deploys new AgentToken with specified name/symbol
3. Creates Uniswap V4 pool (Agent/USDC)
4. Initializes pool at 1:1 price
5. Adds liquidity (80% of tokens + all USDC)
6. Transfers 20% of tokens to creator
7. Factory holds the LP position NFT
8. Emits `AgentCreated` event

**Returns**: Address of the newly created agent token

**Example Flow**:
```solidity
// 1. User approves USDC
usdc.approve(agentFactory, 1000 * 1e6); // 1000 USDC

// 2. User creates agent
address agentToken = agentFactory.createAgent(
    "ChessGPT Alpha",
    "CGPT",
    1000 * 1e6  // 1000 USDC for liquidity
);
```

---

### Registering a Battle

**Function**: `BattleManager.registerMatch(address agent1, address agent2)`

**Who calls**: Users or frontend when initiating a battle

**Requirements**:
- Both agents must exist (created via AgentFactory)
- Agents must be different
- Both agents must have passed cooldown period (1 hour since last match)

**What happens**:
1. Validates both agents exist
2. Checks cooldown periods
3. Generates unique `matchId`
4. Creates match record with status `InProgress`
5. Updates last match timestamp for both agents
6. Emits `MatchRegistered` event

**Returns**: `bytes32 matchId` for tracking the match

**Example Flow**:
```solidity
bytes32 matchId = battleManager.registerMatch(
    agentTokenA,  // First agent
    agentTokenB   // Second agent
);
// Backend receives matchId and starts chess game
```

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
- `getAgentInfo(address tokenAddress)` - Returns agent metadata (name, symbol, creator, positionId, etc.)

**BattleManager**:
- `getMatch(bytes32 matchId)` - Returns match details (agents, winner, status, timestamps)
- `getAllMatches()` - Returns array of all match IDs
- `getAgentStats(address agent)` - Returns wins, losses, total matches

**GambAItHook**:
- `getClaimable(address account, Currency currency)` - Returns claimable fee amount

---

## Protocol Wallet Functions (Called by Backend)

The protocol wallet is a backend-controlled address that signs match results and manages settlements.

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
4. Executes LP stake transfer (10% from loser to winner):
   - Decreases loser's LP position
   - Swaps loser's agent tokens to USDC
   - Increases winner's LP position with USDC
5. Updates agent statistics (wins/losses)
6. Sets match status to `Completed`
7. Emits `MatchSettled` event

**Example Backend Code**:
```javascript
// After chess game completes on backend
const matchId = "0x1234..."; // From registerMatch
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
- Match must exist and be `InProgress`
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
2. Sets match status to `Cancelled`
3. No LP transfers occur
4. Emits `MatchCancelled` event

**Use Cases**:
- Game crashed or had technical issues
- Invalid game state detected
- Players disconnected

---

### Cancelling Expired Matches (No Signature Required)

**Function**: `BattleManager.cancelExpiredMatch(bytes32 matchId)`

**Who calls**: Anyone (permissionless)

**Requirements**:
- Match must be `InProgress`
- Match must be older than 24 hours

**What happens**:
- Sets match status to `Cancelled`
- No LP transfers occur

**Use Cases**:
- Cleanup of stalled matches
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
// 1. User creates agent
usdc.approve(agentFactory, 1000e6);
address myAgent = agentFactory.createAgent("AlphaChess", "ALPHA", 1000e6);

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

### Journey 2: Battling Two Agents

```solidity
// 1. User initiates battle (frontend)
bytes32 matchId = battleManager.registerMatch(agentA, agentB);

// 2. Backend receives event and starts chess game
//    - Agents play chess using AI engines
//    - Game completes with winner = agentA

// 3. Backend signs and submits result
const messageHash = keccak256(abi.encodePacked(matchId, agentA, chainId, battleManagerAddress));
const signature = await backendWallet.signMessage(messageHash);
await battleManager.settleMatch(matchId, agentA, signature);

// 4. LP stake transfer executes:
//    - 10% of agentB's LP is removed
//    - Tokens swapped to USDC
//    - USDC added to agentA's LP
//    - agentA's market cap increases
//    - agentB's market cap decreases

// 5. Stats update:
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

### Match Timeouts
- 24-hour timeout for settling matches
- Prevents locked matches from blocking agent participation
- Anyone can cancel expired matches

### Access Controls
- Only owner can update critical addresses (signer, treasury, fees)
- Only BattleManager can request LP transfers
- Only PoolManager can call hook functions

---

## Key Constants

### AgentFactory
- `LP_PERCENTAGE = 8000` (80% of tokens to liquidity)
- `CREATOR_PERCENTAGE = 2000` (20% of tokens to creator)
- `POOL_FEE = 3000` (0.3% Uniswap fee)
- `TICK_SPACING = 60`

### BattleManager
- `STAKE_PERCENTAGE = 1000` (10% LP stake per battle)
- `MIN_LIQUIDITY_FLOOR = 1e15`
- `MATCH_COOLDOWN = 1 hours`
- `MATCH_TIMEOUT = 24 hours`

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
event AgentCreated(address indexed tokenAddress, string name, string symbol, address indexed creator, uint256 positionId, uint256 usdcAmount)
```

### BattleManager Events
```solidity
event MatchRegistered(bytes32 indexed matchId, address indexed agent1, address indexed agent2, uint256 timestamp)
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

3. **Generate Backend Wallet**:
   ```
   1. Create dedicated wallet for result signing
   2. Note down private key securely
   3. Set as resultSigner in BattleManager
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
    // Display: name, symbol, creator, marketCap, wins, losses
}
```

**Create Agent Form**:
```javascript
// User inputs: name, symbol, usdcAmount
await usdc.approve(agentFactory.address, usdcAmount);
const tx = await agentFactory.createAgent(name, symbol, usdcAmount);
const receipt = await tx.wait();
// Parse AgentCreated event for new token address
```

**Start Battle**:
```javascript
const tx = await battleManager.registerMatch(agentA, agentB);
const receipt = await tx.wait();
// Parse MatchRegistered event for matchId
// Send matchId to backend to start chess game
```

**Monitor Match Status**:
```javascript
const match = await battleManager.getMatch(matchId);
// match.status: 0=Pending, 1=InProgress, 2=Completed, 3=Cancelled
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

### Chess Game Flow

1. **Listen for MatchRegistered events**:
```javascript
battleManager.on('MatchRegistered', async (matchId, agent1, agent2, timestamp) => {
    // Start chess game between agent1 and agent2
    const gameResult = await runChessGame(agent1, agent2);

    // Sign and submit result
    if (gameResult.winner) {
        const signature = await signMatchResult(matchId, gameResult.winner);
        await battleManager.settleMatch(matchId, gameResult.winner, signature);
    } else {
        // Game was draw or error
        const signature = await signMatchCancellation(matchId);
        await battleManager.cancelMatch(matchId, signature);
    }
});
```

2. **Sign match results**:
```javascript
async function signMatchResult(matchId, winner) {
    const messageHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'address', 'uint256', 'address'],
        [matchId, winner, chainId, battleManager.address]
    );
    return await backendWallet.signMessage(ethers.getBytes(messageHash));
}
```

3. **Sign cancellations**:
```javascript
async function signMatchCancellation(matchId) {
    const messageHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'string', 'uint256', 'address'],
        [matchId, 'cancel', chainId, battleManager.address]
    );
    return await backendWallet.signMessage(ethers.getBytes(messageHash));
}
```

---

## Troubleshooting

### Common Issues

**"Agent cooldown" error**:
- Each agent can only battle once per hour
- Wait until `lastMatchTimestamp[agent] + 1 hour` has passed

**"Invalid signature" error**:
- Verify signature is generated with correct format
- Ensure `resultSigner` address matches backend wallet
- Check chainId matches deployment chain

**"Match expired" error**:
- Match must be settled within 24 hours
- Use `cancelExpiredMatch` to clean up

**"InsufficientUSDC" error**:
- User hasn't approved enough USDC to AgentFactory
- User's USDC balance is too low
- Ensure `usdcAmount >= creationFee`

---

## Gas Optimization Notes

- LP transfers involve multiple operations (decrease, swap, increase) and consume significant gas
- Consider batching multiple claim operations
- Full-range liquidity positions simplify calculations but may not be capital efficient
- Hook execution adds overhead to every swap

---

## Future Improvements

Potential enhancements (not currently implemented):
- Dynamic stake percentages based on agent ranking
- Multiple battle formats (tournaments, leagues)
- Agent leveling system tied to wins
- Concentrated liquidity positions (custom tick ranges)
- Dynamic fee tiers based on agent popularity
- Governance for protocol parameters
