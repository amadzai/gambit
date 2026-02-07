// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import "./AgentFactory.sol";

/**
 * @title BattleManager
 * @notice Manages chess battles between AI agents with LP stake transfers
 * @dev Challenge/accept flow: agents choose their own stake amounts
 */
contract BattleManager is ReentrancyGuard, Ownable, IERC721Receiver {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice AgentFactory contract
    AgentFactory public immutable agentFactory;

    /// @notice Uniswap V4 PoolManager
    IPoolManager public immutable poolManager;

    /// @notice Uniswap V4 PositionManager
    IPositionManager public immutable positionManager;

    /// @notice Backend wallet authorized to sign match results
    address public resultSigner;

    /// @notice Minimum liquidity floor that an agent must retain
    uint128 public constant MIN_LIQUIDITY_FLOOR = 1e15;

    /// @notice Match cooldown period (1 hour)
    uint256 public constant MATCH_COOLDOWN = 1 hours;

    /// @notice Match timeout period (24 hours)
    uint256 public constant MATCH_TIMEOUT = 24 hours;

    struct AgentStats {
        uint256 wins;
        uint256 losses;
        uint256 totalMatches;
    }

    /// @notice Agent statistics
    mapping(address => AgentStats) public agentStats;

    /// @notice Last match timestamp for each agent
    mapping(address => uint256) public lastMatchTimestamp;

    enum MatchStatus {
        Pending,
        InProgress,
        Completed,
        Cancelled
    }

    struct Match {
        bytes32 matchId;
        address agent1;
        address agent2;
        address winner;
        uint128 agent1Stake;
        uint128 agent2Stake;
        bool agent2Accepted;
        MatchStatus status;
        uint256 createdAt;
        uint256 settledAt;
    }

    /// @notice Mapping from matchId to Match details
    mapping(bytes32 => Match) public matches;

    /// @notice Prevent signature replay attacks
    mapping(bytes32 => bool) public usedSignatures;

    /// @notice Array of all match IDs
    bytes32[] public allMatches;

    event ChallengeCreated(
        bytes32 indexed matchId,
        address indexed agent1,
        address indexed agent2,
        uint128 agent1Stake,
        uint256 timestamp
    );

    event ChallengeAccepted(
        bytes32 indexed matchId,
        address indexed agent2,
        uint128 agent2Stake,
        uint256 timestamp
    );

    event MatchSettled(
        bytes32 indexed matchId,
        address indexed winner,
        address indexed loser,
        uint256 timestamp
    );

    event MatchCancelled(
        bytes32 indexed matchId,
        uint256 timestamp
    );

    event ResultSignerUpdated(address indexed newSigner);

    error InvalidAddress();
    error InvalidAgent();
    error MatchAlreadyExists();
    error MatchNotFound();
    error MatchAlreadySettled();
    error MatchNotPending();
    error MatchNotInProgress();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error InvalidWinner();
    error NotAgentWallet();
    error InvalidStake();
    error InsufficientLiquidity();
    error SameAgent();

    /**
     * @notice Deploy BattleManager
     * @param _agentFactory AgentFactory contract address
     * @param _poolManager Uniswap V4 PoolManager address
     * @param _positionManager Uniswap V4 PositionManager address
     * @param _resultSigner Backend wallet authorized to sign results
     */
    constructor(
        address _agentFactory,
        address _poolManager,
        address _positionManager,
        address _resultSigner
    ) Ownable(msg.sender) {
        if (_agentFactory == address(0) || _poolManager == address(0) ||
            _positionManager == address(0) || _resultSigner == address(0)) {
            revert InvalidAddress();
        }

        agentFactory = AgentFactory(_agentFactory);
        poolManager = IPoolManager(_poolManager);
        positionManager = IPositionManager(_positionManager);
        resultSigner = _resultSigner;
    }

    /**
     * @notice Challenge another agent to a battle
     * @param agent1Token Address of challenger's agent token
     * @param agent2Token Address of opponent's agent token
     * @param stakeAmount Amount of liquidity the challenger is staking
     * @return matchId Unique identifier for the match
     */
    function challengeAgent(
        address agent1Token,
        address agent2Token,
        uint128 stakeAmount
    ) external nonReentrant returns (bytes32 matchId) {
        if (agent1Token == agent2Token) revert SameAgent();
        if (stakeAmount == 0) revert InvalidStake();

        AgentFactory.AgentInfo memory info1 = agentFactory.getAgentInfo(agent1Token);
        AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(agent2Token);

        if (!info1.exists || !info2.exists) revert InvalidAgent();
        if (msg.sender != info1.agentWallet) revert NotAgentWallet();

        // Check cooldown
        require(block.timestamp >= lastMatchTimestamp[agent1Token] + MATCH_COOLDOWN, "Agent1 cooldown");
        lastMatchTimestamp[agent1Token] = block.timestamp;

        // Verify agent1 has enough liquidity to stake
        uint128 agent1Liquidity = positionManager.getPositionLiquidity(info1.agentPositionId);
        if (agent1Liquidity < stakeAmount + MIN_LIQUIDITY_FLOOR) revert InsufficientLiquidity();

        // Generate unique match ID
        matchId = keccak256(abi.encodePacked(
            agent1Token,
            agent2Token,
            block.timestamp,
            block.number
        ));

        if (matches[matchId].createdAt != 0) {
            revert MatchAlreadyExists();
        }

        // Transfer agent1's LP NFT to BattleManager (escrow)
        IERC721(address(positionManager)).safeTransferFrom(msg.sender, address(this), info1.agentPositionId);

        // Create match record
        matches[matchId] = Match({
            matchId: matchId,
            agent1: agent1Token,
            agent2: agent2Token,
            winner: address(0),
            agent1Stake: stakeAmount,
            agent2Stake: 0,
            agent2Accepted: false,
            status: MatchStatus.Pending,
            createdAt: block.timestamp,
            settledAt: 0
        });

        allMatches.push(matchId);

        emit ChallengeCreated(matchId, agent1Token, agent2Token, stakeAmount, block.timestamp);
    }

    /**
     * @notice Accept a challenge from another agent
     * @param matchId Match identifier
     * @param stakeAmount Amount of liquidity the acceptor is staking
     */
    function acceptChallenge(
        bytes32 matchId,
        uint128 stakeAmount
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status != MatchStatus.Pending) revert MatchNotPending();
        if (stakeAmount == 0) revert InvalidStake();

        // Check timeout
        require(block.timestamp <= matchData.createdAt + MATCH_TIMEOUT, "Challenge expired");

        AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(matchData.agent2);
        if (msg.sender != info2.agentWallet) revert NotAgentWallet();

        // Check cooldown
        require(block.timestamp >= lastMatchTimestamp[matchData.agent2] + MATCH_COOLDOWN, "Agent2 cooldown");
        lastMatchTimestamp[matchData.agent2] = block.timestamp;

        // Verify agent2 has enough liquidity to stake
        uint128 agent2Liquidity = positionManager.getPositionLiquidity(info2.agentPositionId);
        if (agent2Liquidity < stakeAmount + MIN_LIQUIDITY_FLOOR) revert InsufficientLiquidity();

        // Transfer agent2's LP NFT to BattleManager (escrow)
        IERC721(address(positionManager)).safeTransferFrom(msg.sender, address(this), info2.agentPositionId);

        // Update match
        matchData.agent2Stake = stakeAmount;
        matchData.agent2Accepted = true;
        matchData.status = MatchStatus.InProgress;

        emit ChallengeAccepted(matchId, matchData.agent2, stakeAmount, block.timestamp);
    }

    /**
     * @notice Decline or cancel a pending challenge
     * @param matchId Match identifier
     */
    function declineChallenge(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status != MatchStatus.Pending) revert MatchNotPending();

        AgentFactory.AgentInfo memory info1 = agentFactory.getAgentInfo(matchData.agent1);
        AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(matchData.agent2);

        // Either agent's wallet or the result signer can decline
        require(
            msg.sender == info1.agentWallet ||
            msg.sender == info2.agentWallet ||
            msg.sender == resultSigner,
            "Not authorized"
        );

        // Return agent1's escrowed LP NFT
        IERC721(address(positionManager)).safeTransferFrom(address(this), info1.agentWallet, info1.agentPositionId);

        matchData.status = MatchStatus.Cancelled;
        matchData.settledAt = block.timestamp;

        emit MatchCancelled(matchId, block.timestamp);
    }

    /**
     * @notice Settle a completed match with backend signature
     * @param matchId Match identifier
     * @param winner Address of winning agent token
     * @param signature Backend signature authorizing settlement
     */
    function settleMatch(
        bytes32 matchId,
        address winner,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status != MatchStatus.InProgress) revert MatchNotInProgress();
        if (winner != matchData.agent1 && winner != matchData.agent2) revert InvalidWinner();

        // Check timeout
        require(block.timestamp <= matchData.createdAt + MATCH_TIMEOUT, "Match expired");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            matchId,
            winner,
            block.chainid,
            address(this)
        ));

        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        if (usedSignatures[ethSignedMessageHash]) revert SignatureAlreadyUsed();

        address signer = ethSignedMessageHash.recover(signature);
        if (signer != resultSigner) revert InvalidSignature();

        // Mark signature as used
        usedSignatures[ethSignedMessageHash] = true;

        // Determine loser
        address loser = (winner == matchData.agent1) ? matchData.agent2 : matchData.agent1;
        uint128 loserStake = (loser == matchData.agent1) ? matchData.agent1Stake : matchData.agent2Stake;

        // Execute LP transfer from loser to winner
        _transferLPStake(loser, winner, loserStake);

        // Return LP NFTs to their respective agent wallets
        _returnLPNFTs(matchData.agent1, matchData.agent2);

        // Update agent stats
        agentStats[winner].wins++;
        agentStats[winner].totalMatches++;
        agentStats[loser].losses++;
        agentStats[loser].totalMatches++;

        // Update match status
        matchData.winner = winner;
        matchData.status = MatchStatus.Completed;
        matchData.settledAt = block.timestamp;

        emit MatchSettled(matchId, winner, loser, block.timestamp);
    }

    /**
     * @notice Cancel a match with backend signature (for in-progress matches)
     * @param matchId Match identifier
     * @param signature Backend signature authorizing cancellation
     */
    function cancelMatch(
        bytes32 matchId,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status == MatchStatus.Completed || matchData.status == MatchStatus.Cancelled) {
            revert MatchAlreadySettled();
        }

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            matchId,
            "cancel",
            block.chainid,
            address(this)
        ));

        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        if (usedSignatures[ethSignedMessageHash]) revert SignatureAlreadyUsed();

        address signer = ethSignedMessageHash.recover(signature);
        if (signer != resultSigner) revert InvalidSignature();

        // Mark signature as used
        usedSignatures[ethSignedMessageHash] = true;

        // Return escrowed LP NFTs
        _returnEscrowedNFTs(matchData);

        // Update match status
        matchData.status = MatchStatus.Cancelled;
        matchData.settledAt = block.timestamp;

        emit MatchCancelled(matchId, block.timestamp);
    }

    /**
     * @notice Get match details
     * @param matchId Match identifier
     * @return Match information
     */
    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    /**
     * @notice Get all match IDs
     * @return Array of all match IDs
     */
    function getAllMatches() external view returns (bytes32[] memory) {
        return allMatches;
    }

    /**
     * @notice Cancel an expired match (anyone can call)
     * @param matchId Match identifier
     */
    function cancelExpiredMatch(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];
        require(
            matchData.status == MatchStatus.InProgress || matchData.status == MatchStatus.Pending,
            "Not active"
        );
        require(block.timestamp > matchData.createdAt + MATCH_TIMEOUT, "Not expired");

        // Return escrowed LP NFTs
        _returnEscrowedNFTs(matchData);

        matchData.status = MatchStatus.Cancelled;
        matchData.settledAt = block.timestamp;
        emit MatchCancelled(matchId, block.timestamp);
    }

    /**
     * @notice Get agent statistics
     * @param agent Agent token address
     * @return Agent stats
     */
    function getAgentStats(address agent) external view returns (AgentStats memory) {
        return agentStats[agent];
    }

    /**
     * @notice Sweep tokens (admin function)
     * @param token Token address to sweep
     * @param to Recipient address
     */
    function sweepTokens(address token, address to) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) IERC20(token).transfer(to, balance);
    }

    /**
     * @notice Update result signer address (only owner)
     * @param _resultSigner New result signer address
     */
    function setResultSigner(address _resultSigner) external onlyOwner {
        if (_resultSigner == address(0)) revert InvalidAddress();
        resultSigner = _resultSigner;
        emit ResultSignerUpdated(_resultSigner);
    }

    /**
     * @notice Required to receive ERC721 LP NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // Internal functions

    /**
     * @notice Return escrowed LP NFTs based on match state
     */
    function _returnEscrowedNFTs(Match storage matchData) internal {
        AgentFactory.AgentInfo memory info1 = agentFactory.getAgentInfo(matchData.agent1);

        // Agent1's NFT is always escrowed (they initiated the challenge)
        IERC721(address(positionManager)).safeTransferFrom(
            address(this), info1.agentWallet, info1.agentPositionId
        );

        // Agent2's NFT is only escrowed if they accepted
        if (matchData.agent2Accepted) {
            AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(matchData.agent2);
            IERC721(address(positionManager)).safeTransferFrom(
                address(this), info2.agentWallet, info2.agentPositionId
            );
        }
    }

    /**
     * @notice Return both LP NFTs to their respective agent wallets
     */
    function _returnLPNFTs(address agent1Token, address agent2Token) internal {
        AgentFactory.AgentInfo memory info1 = agentFactory.getAgentInfo(agent1Token);
        AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(agent2Token);

        IERC721(address(positionManager)).safeTransferFrom(
            address(this), info1.agentWallet, info1.agentPositionId
        );
        IERC721(address(positionManager)).safeTransferFrom(
            address(this), info2.agentWallet, info2.agentPositionId
        );
    }

    /**
     * @notice Transfer LP stake from loser to winner
     * @param loser Address of losing agent token
     * @param winner Address of winning agent token
     * @param stakeAmount Amount of liquidity to transfer from loser
     */
    function _transferLPStake(address loser, address winner, uint128 stakeAmount) internal {
        AgentFactory.AgentInfo memory loserInfo = agentFactory.getAgentInfo(loser);
        AgentFactory.AgentInfo memory winnerInfo = agentFactory.getAgentInfo(winner);
        uint256 loserPositionId = loserInfo.agentPositionId;
        uint256 winnerPositionId = winnerInfo.agentPositionId;

        // Get loser's current liquidity and enforce minimum floor
        uint128 loserLiquidity = positionManager.getPositionLiquidity(loserPositionId);
        uint128 actualStake = stakeAmount;

        if (loserLiquidity - actualStake < MIN_LIQUIDITY_FLOOR) {
            if (loserLiquidity <= MIN_LIQUIDITY_FLOOR) return; // Can't stake anything
            actualStake = loserLiquidity - MIN_LIQUIDITY_FLOOR;
        }

        // Decrease loser's liquidity → tokens come to BattleManager
        PoolKey memory loserPoolKey = agentFactory._createPoolKey(loser);
        {
            bytes memory actions = abi.encodePacked(
                uint8(Actions.DECREASE_LIQUIDITY),
                uint8(Actions.TAKE_PAIR)
            );
            bytes[] memory params = new bytes[](2);
            params[0] = abi.encode(loserPositionId, actualStake, 0, 0, "");
            params[1] = abi.encode(loserPoolKey.currency0, loserPoolKey.currency1, address(this));
            positionManager.modifyLiquidities(abi.encode(actions, params), block.timestamp + 60);
        }

        // Swap loser agent tokens → USDC
        uint256 loserTokenBalance = IERC20(loser).balanceOf(address(this));
        if (loserTokenBalance > 0) {
            IERC20(loser).approve(address(positionManager), loserTokenBalance);
            bool zeroForOne = address(loser) < address(agentFactory.usdc());
            bytes memory swapActions = abi.encodePacked(
                uint8(Actions.SWAP_EXACT_IN_SINGLE),
                uint8(Actions.SETTLE),
                uint8(Actions.TAKE)
            );
            bytes[] memory swapParams = new bytes[](3);
            swapParams[0] = abi.encode(
                loserPoolKey,
                zeroForOne,
                loserTokenBalance,
                0,   // amountOutMin (hackathon: 0, production: add slippage)
                ""   // hookData
            );
            Currency inputCurrency = zeroForOne ? loserPoolKey.currency0 : loserPoolKey.currency1;
            Currency outputCurrency = zeroForOne ? loserPoolKey.currency1 : loserPoolKey.currency0;
            swapParams[1] = abi.encode(inputCurrency, loserTokenBalance, false);
            swapParams[2] = abi.encode(outputCurrency, address(this), 0);
            positionManager.modifyLiquidities(abi.encode(swapActions, swapParams), block.timestamp + 60);
        }

        // Increase winner's liquidity with collected USDC
        uint256 usdcBalance = IERC20(address(agentFactory.usdc())).balanceOf(address(this));
        if (usdcBalance > 0) {
            IERC20(address(agentFactory.usdc())).approve(address(positionManager), usdcBalance);
            PoolKey memory winnerPoolKey = agentFactory._createPoolKey(winner);
            bytes memory increaseActions = abi.encodePacked(
                uint8(Actions.INCREASE_LIQUIDITY),
                uint8(Actions.CLOSE_CURRENCY),
                uint8(Actions.CLOSE_CURRENCY)
            );
            bytes[] memory increaseParams = new bytes[](3);
            increaseParams[0] = abi.encode(
                winnerPositionId,
                usdcBalance,
                type(uint128).max,
                type(uint128).max,
                ""
            );
            increaseParams[1] = abi.encode(winnerPoolKey.currency0);
            increaseParams[2] = abi.encode(winnerPoolKey.currency1);
            positionManager.modifyLiquidities(abi.encode(increaseActions, increaseParams), block.timestamp + 60);
        }
    }
}
