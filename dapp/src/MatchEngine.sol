// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AgentFactory.sol";

/**
 * @title MatchEngine
 * @notice Simple USDC-based challenge/accept match flow for AI chess agents
 * @dev Agent wallets stake USDC directly; backend signs settlements
 */
contract MatchEngine is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice AgentFactory contract
    AgentFactory public immutable agentFactory;

    /// @notice USDC token
    IERC20 public immutable usdc;

    /// @notice Backend wallet authorized to sign match results
    address public resultSigner;

    /// @notice Match timeout period (24 hours)
    uint256 public constant MATCH_TIMEOUT = 24 hours;

    enum MatchStatus {
        Pending,
        Active,
        Settled,
        Cancelled
    }

    struct Match {
        address agent1Token;
        address agent2Token;
        address agent1Wallet;  // cached for refunds
        address agent2Wallet;
        uint256 stakeAmount;   // per side (both must match)
        address winnerToken;
        MatchStatus status;
        uint256 createdAt;
    }

    /// @notice Mapping from matchId to Match details
    mapping(bytes32 => Match) public matches;

    /// @notice Prevent signature replay attacks
    mapping(bytes32 => bool) public usedSignatures;

    /// @notice Array of all match IDs
    bytes32[] public allMatches;

    event ChallengeCreated(
        bytes32 indexed matchId,
        address indexed agent1Token,
        address indexed agent2Token,
        uint256 stakeAmount,
        uint256 timestamp
    );

    event ChallengeAccepted(
        bytes32 indexed matchId,
        address indexed agent2Wallet,
        uint256 timestamp
    );

    event MatchSettled(
        bytes32 indexed matchId,
        address indexed winnerToken,
        uint256 totalPot,
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
    error MatchNotPending();
    error MatchNotActive();
    error MatchAlreadySettled();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error InvalidWinner();
    error NotAgentWallet();
    error InvalidStake();
    error SameAgent();
    error MatchExpired();
    error MatchNotExpired();
    error TransferFailed();

    constructor(
        address payable _agentFactory,
        address _usdc,
        address _resultSigner
    ) Ownable(msg.sender) {
        if (_agentFactory == address(0) || _usdc == address(0) || _resultSigner == address(0)) {
            revert InvalidAddress();
        }

        agentFactory = AgentFactory(_agentFactory);
        usdc = IERC20(_usdc);
        resultSigner = _resultSigner;
    }

    /**
     * @notice Challenge another agent to a match
     * @param myAgentToken Address of challenger's agent token
     * @param opponentToken Address of opponent's agent token
     * @param stakeAmount Amount of USDC to stake (opponent must match)
     * @return matchId Unique identifier for the match
     */
    function challenge(
        address myAgentToken,
        address opponentToken,
        uint256 stakeAmount
    ) external nonReentrant returns (bytes32 matchId) {
        if (myAgentToken == opponentToken) revert SameAgent();
        if (stakeAmount == 0) revert InvalidStake();

        AgentFactory.AgentInfo memory info1 = agentFactory.getAgentInfo(myAgentToken);
        AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(opponentToken);

        if (!info1.exists || !info2.exists) revert InvalidAgent();
        if (msg.sender != info1.agentWallet) revert NotAgentWallet();

        // Generate unique match ID
        matchId = keccak256(abi.encodePacked(
            myAgentToken,
            opponentToken,
            stakeAmount,
            block.timestamp,
            block.number
        ));

        if (matches[matchId].createdAt != 0) revert MatchAlreadyExists();

        // Transfer stakeAmount USDC from challenger to this contract
        if (!usdc.transferFrom(msg.sender, address(this), stakeAmount)) {
            revert TransferFailed();
        }

        matches[matchId] = Match({
            agent1Token: myAgentToken,
            agent2Token: opponentToken,
            agent1Wallet: info1.agentWallet,
            agent2Wallet: info2.agentWallet,
            stakeAmount: stakeAmount,
            winnerToken: address(0),
            status: MatchStatus.Pending,
            createdAt: block.timestamp
        });

        allMatches.push(matchId);

        emit ChallengeCreated(matchId, myAgentToken, opponentToken, stakeAmount, block.timestamp);
    }

    /**
     * @notice Accept a challenge
     * @param matchId Match identifier
     */
    function acceptChallenge(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status != MatchStatus.Pending) revert MatchNotPending();
        if (block.timestamp > matchData.createdAt + MATCH_TIMEOUT) revert MatchExpired();
        if (msg.sender != matchData.agent2Wallet) revert NotAgentWallet();

        // Transfer matching stakeAmount USDC from acceptor to this contract
        if (!usdc.transferFrom(msg.sender, address(this), matchData.stakeAmount)) {
            revert TransferFailed();
        }

        matchData.status = MatchStatus.Active;

        emit ChallengeAccepted(matchId, msg.sender, block.timestamp);
    }

    /**
     * @notice Decline or withdraw a pending challenge
     * @param matchId Match identifier
     */
    function declineChallenge(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status != MatchStatus.Pending) revert MatchNotPending();

        // Either agent's wallet can decline/withdraw
        if (msg.sender != matchData.agent1Wallet && msg.sender != matchData.agent2Wallet) {
            revert NotAgentWallet();
        }

        // Return agent1's stake
        if (!usdc.transfer(matchData.agent1Wallet, matchData.stakeAmount)) {
            revert TransferFailed();
        }

        matchData.status = MatchStatus.Cancelled;

        emit MatchCancelled(matchId, block.timestamp);
    }

    /**
     * @notice Settle a match with backend signature
     * @param matchId Match identifier
     * @param winnerToken Address of winning agent token (address(0) for draw)
     * @param signature Backend ECDSA signature over (matchId, winnerToken, chainid, contractAddress)
     */
    function settleMatch(
        bytes32 matchId,
        address winnerToken,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status != MatchStatus.Active) revert MatchNotActive();

        // winnerToken must be one of the agents or address(0) for draw
        if (winnerToken != address(0) && winnerToken != matchData.agent1Token && winnerToken != matchData.agent2Token) {
            revert InvalidWinner();
        }

        // Verify backend signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            matchId,
            winnerToken,
            block.chainid,
            address(this)
        ));

        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        if (usedSignatures[ethSignedMessageHash]) revert SignatureAlreadyUsed();

        address signer = ethSignedMessageHash.recover(signature);
        if (signer != resultSigner) revert InvalidSignature();

        usedSignatures[ethSignedMessageHash] = true;

        uint256 totalPot = matchData.stakeAmount * 2;

        if (winnerToken == address(0)) {
            // Draw: return stakes to both wallets
            if (!usdc.transfer(matchData.agent1Wallet, matchData.stakeAmount)) revert TransferFailed();
            if (!usdc.transfer(matchData.agent2Wallet, matchData.stakeAmount)) revert TransferFailed();
        } else {
            // Winner takes all
            address winnerWallet = (winnerToken == matchData.agent1Token)
                ? matchData.agent1Wallet
                : matchData.agent2Wallet;
            if (!usdc.transfer(winnerWallet, totalPot)) revert TransferFailed();
        }

        matchData.winnerToken = winnerToken;
        matchData.status = MatchStatus.Settled;

        emit MatchSettled(matchId, winnerToken, totalPot, block.timestamp);
    }

    /**
     * @notice Cancel an active match with backend signature
     * @param matchId Match identifier
     * @param signature Backend ECDSA signature over (matchId, "cancel", chainid, contractAddress)
     */
    function cancelMatch(
        bytes32 matchId,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status == MatchStatus.Settled || matchData.status == MatchStatus.Cancelled) {
            revert MatchAlreadySettled();
        }

        // Verify backend signature
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

        usedSignatures[ethSignedMessageHash] = true;

        // Return stakes
        if (!usdc.transfer(matchData.agent1Wallet, matchData.stakeAmount)) revert TransferFailed();

        // Only return agent2's stake if match was Active (they had deposited)
        if (matchData.status == MatchStatus.Active) {
            if (!usdc.transfer(matchData.agent2Wallet, matchData.stakeAmount)) revert TransferFailed();
        }

        matchData.status = MatchStatus.Cancelled;

        emit MatchCancelled(matchId, block.timestamp);
    }

    /**
     * @notice Cancel an expired pending challenge (anyone can call)
     * @param matchId Match identifier
     */
    function cancelExpiredChallenge(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.createdAt == 0) revert MatchNotFound();
        if (matchData.status != MatchStatus.Pending) revert MatchNotPending();
        if (block.timestamp <= matchData.createdAt + MATCH_TIMEOUT) revert MatchNotExpired();

        // Return agent1's stake
        if (!usdc.transfer(matchData.agent1Wallet, matchData.stakeAmount)) revert TransferFailed();

        matchData.status = MatchStatus.Cancelled;

        emit MatchCancelled(matchId, block.timestamp);
    }

    // View functions

    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getAllMatches() external view returns (bytes32[] memory) {
        return allMatches;
    }

    /**
     * @notice Update result signer address (only owner)
     */
    function setResultSigner(address _resultSigner) external onlyOwner {
        if (_resultSigner == address(0)) revert InvalidAddress();
        resultSigner = _resultSigner;
        emit ResultSignerUpdated(_resultSigner);
    }
}
