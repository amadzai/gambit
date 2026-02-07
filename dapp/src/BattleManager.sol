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
 * @dev Verifies backend signatures, locks stakes, and settles matches
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

    /// @notice Percentage of LP to stake in battles (basis points, 1000 = 10%)
    uint256 public constant STAKE_PERCENTAGE = 1000;

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

    event MatchRegistered(
        bytes32 indexed matchId,
        address indexed agent1,
        address indexed agent2,
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
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error InvalidWinner();
    error OnlyResultSigner();

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
     * @notice Register a new match between two agents
     * @param agent1 Address of first agent token
     * @param agent2 Address of second agent token
     * @return matchId Unique identifier for the match
     */
    function registerMatch(
        address agent1,
        address agent2
    ) external nonReentrant returns (bytes32 matchId) {
        // Verify both agents exist
        AgentFactory.AgentInfo memory info1 = agentFactory.getAgentInfo(agent1);
        AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(agent2);

        if (!info1.exists || !info2.exists) revert InvalidAgent();
        if (agent1 == agent2) revert InvalidAgent();

        // Check cooldown periods
        require(block.timestamp >= lastMatchTimestamp[agent1] + MATCH_COOLDOWN, "Agent1 cooldown");
        require(block.timestamp >= lastMatchTimestamp[agent2] + MATCH_COOLDOWN, "Agent2 cooldown");
        lastMatchTimestamp[agent1] = block.timestamp;
        lastMatchTimestamp[agent2] = block.timestamp;

        // Generate unique match ID
        matchId = keccak256(abi.encodePacked(
            agent1,
            agent2,
            block.timestamp,
            block.number
        ));

        if (matches[matchId].status != MatchStatus.Pending) {
            revert MatchAlreadyExists();
        }

        // Create match record
        matches[matchId] = Match({
            matchId: matchId,
            agent1: agent1,
            agent2: agent2,
            winner: address(0),
            status: MatchStatus.InProgress,
            createdAt: block.timestamp,
            settledAt: 0
        });

        allMatches.push(matchId);

        emit MatchRegistered(matchId, agent1, agent2, block.timestamp);
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

        if (matchData.status == MatchStatus.Pending) revert MatchNotFound();
        if (matchData.status == MatchStatus.Completed) revert MatchAlreadySettled();
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

        // Execute LP transfer from loser to winner
        _transferLPStake(loser, winner);

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
     * @notice Cancel a match with backend signature
     * @param matchId Match identifier
     * @param signature Backend signature authorizing cancellation
     */
    function cancelMatch(
        bytes32 matchId,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.status == MatchStatus.Pending) revert MatchNotFound();
        if (matchData.status == MatchStatus.Completed) revert MatchAlreadySettled();

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
     * @notice Cancel an expired match
     * @param matchId Match identifier
     */
    function cancelExpiredMatch(bytes32 matchId) external {
        Match storage matchData = matches[matchId];
        require(matchData.status == MatchStatus.InProgress, "Not in progress");
        require(block.timestamp > matchData.createdAt + MATCH_TIMEOUT, "Not expired");
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
     * @notice Transfer LP stake from loser to winner
     * @param loser Address of losing agent token
     * @param winner Address of winning agent token
     */
    function _transferLPStake(address loser, address winner) internal {
        AgentFactory.AgentInfo memory loserInfo = agentFactory.getAgentInfo(loser);
        AgentFactory.AgentInfo memory winnerInfo = agentFactory.getAgentInfo(winner);
        uint256 loserPositionId = loserInfo.positionId;
        uint256 winnerPositionId = winnerInfo.positionId;

        // 1. Request NFT transfer from factory (if factory still holds it)
        _ensurePositionOwnership(loserPositionId);
        _ensurePositionOwnership(winnerPositionId);

        // 2. Get loser's current liquidity
        uint128 loserLiquidity = positionManager.getPositionLiquidity(loserPositionId);
        uint128 stakeAmount = uint128(uint256(loserLiquidity) * STAKE_PERCENTAGE / 10000);

        // 3. Enforce minimum liquidity floor
        if (loserLiquidity - stakeAmount < MIN_LIQUIDITY_FLOOR) {
            if (loserLiquidity <= MIN_LIQUIDITY_FLOOR) return; // Can't stake anything
            stakeAmount = loserLiquidity - MIN_LIQUIDITY_FLOOR;
        }

        // 4. Decrease loser's liquidity → tokens come to BattleManager
        PoolKey memory loserPoolKey = agentFactory._createPoolKey(loser);
        {
            bytes memory actions = abi.encodePacked(
                uint8(Actions.DECREASE_LIQUIDITY),
                uint8(Actions.TAKE_PAIR)
            );
            bytes[] memory params = new bytes[](2);
            params[0] = abi.encode(loserPositionId, stakeAmount, 0, 0, "");
            params[1] = abi.encode(loserPoolKey.currency0, loserPoolKey.currency1, address(this));
            positionManager.modifyLiquidities(abi.encode(actions, params), block.timestamp + 60);
        }

        // 5. Swap loser agent tokens → USDC using SWAP_EXACT_IN_SINGLE
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
            // Settle the input currency
            Currency inputCurrency = zeroForOne ? loserPoolKey.currency0 : loserPoolKey.currency1;
            Currency outputCurrency = zeroForOne ? loserPoolKey.currency1 : loserPoolKey.currency0;
            swapParams[1] = abi.encode(inputCurrency, loserTokenBalance, false);
            swapParams[2] = abi.encode(outputCurrency, address(this), 0); // OPEN_DELTA
            positionManager.modifyLiquidities(abi.encode(swapActions, swapParams), block.timestamp + 60);
        }

        // 6. Increase winner's liquidity with collected USDC
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
                usdcBalance,          // liquidityDelta (approximate)
                type(uint128).max,    // amount0Max
                type(uint128).max,    // amount1Max
                ""                    // hookData
            );
            increaseParams[1] = abi.encode(winnerPoolKey.currency0);
            increaseParams[2] = abi.encode(winnerPoolKey.currency1);
            positionManager.modifyLiquidities(abi.encode(increaseActions, increaseParams), block.timestamp + 60);
        }
    }

    /**
     * @notice Ensure BattleManager owns a position NFT
     * @param positionId Position NFT ID
     */
    function _ensurePositionOwnership(uint256 positionId) internal {
        address currentOwner = IERC721(address(positionManager)).ownerOf(positionId);
        if (currentOwner == address(agentFactory)) {
            agentFactory.transferPositionToBattleManager(positionId);
        }
        // If already owned by BattleManager, no action needed
    }

    /**
     * @notice Verify a signature is from the result signer
     * @param messageHash Hash of the message
     * @param signature Signature to verify
     * @return True if signature is valid
     */
    function _verifySignature(
        bytes32 messageHash,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        return signer == resultSigner;
    }
}
