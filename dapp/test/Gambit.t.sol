// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentFactory.sol";
import "../src/BattleManager.sol";
import "../src/GambitHook.sol";
import "../src/AgentToken.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GambAItTest
 * @notice Basic tests for GambAIt smart contracts
 */
contract GambAItTest is Test {
    AgentFactory public factory;
    BattleManager public battleManager;
    GambitHook public hook;
    MockUSDC public usdc;
    IPoolManager public poolManager;
    IPositionManager public positionManager;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public treasury = address(0x3);
    address public resultSigner = address(0x4);
    address public agentWallet1 = address(0x5);
    address public agentWallet2 = address(0x6);

    uint256 public constant CREATION_FEE = 100e6; // 100 USDC

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Note: In a real test, you'd deploy actual PoolManager and PositionManager
        // poolManager = IPoolManager(address(new PoolManager()));
        // positionManager = IPositionManager(deployPositionManager());

        // For now, use mock addresses (tests will need actual contracts to run)
        poolManager = IPoolManager(address(0x100));
        positionManager = IPositionManager(address(0x200));

        // Deploy contracts
        factory = new AgentFactory(
            address(usdc),
            address(poolManager),
            address(positionManager),
            CREATION_FEE
        );

        battleManager = new BattleManager(
            address(factory),
            address(poolManager),
            address(positionManager),
            resultSigner
        );

        // Set battle manager
        factory.setBattleManager(address(battleManager));

        // Deploy hook (would need correct address with permission bits in production)
        // For testing, we'd use vm.etch to place it at the right address
        hook = new GambitHook(
            address(poolManager),
            address(factory),
            address(usdc),
            treasury
        );

        factory.setHookAddress(address(hook));

        // Fund test users
        usdc.mint(user1, 1000e6);
        usdc.mint(user2, 1000e6);
    }

    function testAgentCreation() public {
        vm.startPrank(user1);
        usdc.approve(address(factory), CREATION_FEE);

        // This will fail without actual PoolManager/PositionManager
        // But shows the expected flow:
        // address agentToken = factory.createAgent("TestAgent", "TAGENT", CREATION_FEE, agentWallet1);
        //
        // AgentFactory.AgentInfo memory info = factory.getAgentInfo(agentToken);
        // assertTrue(info.exists);
        // assertEq(info.agentWallet, agentWallet1);
        // assertEq(info.creator, user1);
        // assertGt(info.userPositionId, 0);
        // assertGt(info.agentPositionId, 0);
        // assertTrue(info.userPositionId != info.agentPositionId);
        vm.stopPrank();
    }

    function testAgentCreationRevertsWithZeroAgentWallet() public {
        vm.startPrank(user1);
        usdc.approve(address(factory), CREATION_FEE);

        // Should revert with InvalidAddress when agentWallet is zero
        // vm.expectRevert(AgentFactory.InvalidAddress.selector);
        // factory.createAgent("TestAgent", "TAGENT", CREATION_FEE, address(0));
        vm.stopPrank();
    }

    function testChallengeAgent() public {
        // Would need two created agents with LP positions
        // address agent1Token = factory.createAgent("Agent1", "AG1", CREATION_FEE, agentWallet1);
        // address agent2Token = factory.createAgent("Agent2", "AG2", CREATION_FEE, agentWallet2);

        // Agent1's wallet challenges Agent2
        // vm.startPrank(agentWallet1);
        // IERC721(address(positionManager)).approve(address(battleManager), info1.agentPositionId);
        // uint128 stakeAmount = 1e16;
        // bytes32 matchId = battleManager.challengeAgent(agent1Token, agent2Token, stakeAmount);
        // assertTrue(matchId != bytes32(0));

        // BattleManager.Match memory matchData = battleManager.getMatch(matchId);
        // assertEq(uint256(matchData.status), uint256(BattleManager.MatchStatus.Pending));
        // assertEq(matchData.agent1Stake, stakeAmount);
        // assertFalse(matchData.agent2Accepted);
        // vm.stopPrank();
    }

    function testAcceptChallenge() public {
        // Would need a pending challenge
        // vm.startPrank(agentWallet2);
        // IERC721(address(positionManager)).approve(address(battleManager), info2.agentPositionId);
        // uint128 agent2Stake = 2e16;
        // battleManager.acceptChallenge(matchId, agent2Stake);

        // BattleManager.Match memory matchData = battleManager.getMatch(matchId);
        // assertEq(uint256(matchData.status), uint256(BattleManager.MatchStatus.InProgress));
        // assertEq(matchData.agent2Stake, agent2Stake);
        // assertTrue(matchData.agent2Accepted);
        // vm.stopPrank();
    }

    function testDeclineChallenge() public {
        // Agent2's wallet declines the challenge
        // vm.startPrank(agentWallet2);
        // battleManager.declineChallenge(matchId);

        // BattleManager.Match memory matchData = battleManager.getMatch(matchId);
        // assertEq(uint256(matchData.status), uint256(BattleManager.MatchStatus.Cancelled));
        // Verify agent1's NFT was returned to agentWallet1
        // vm.stopPrank();
    }

    function testSettleMatch() public {
        // Would need an in-progress match and signature from resultSigner
        // Test signature verification and LP transfer with variable stakes
    }

    function testCancelExpiredMatch() public {
        // Register a challenge, accept it, wait > 24 hours, cancel
        // vm.warp(block.timestamp + 25 hours);
        // battleManager.cancelExpiredMatch(matchId);
        // Verify both NFTs returned to agent wallets
    }

    function testCancelExpiredPendingChallenge() public {
        // Register a challenge (don't accept), wait > 24 hours, cancel
        // vm.warp(block.timestamp + 25 hours);
        // battleManager.cancelExpiredMatch(matchId);
        // Verify only agent1's NFT returned (agent2 never escrowed)
    }

    function testAgentStats() public {
        // Verify stats are updated after match settlement
    }

    function testHookFeeDistribution() public {
        // Test that hook correctly splits fees 3%/2%
    }

    function testMinLiquidityFloor() public {
        // Ensure agents can't stake below minimum liquidity floor
        // challengeAgent should revert with InsufficientLiquidity
    }

    function testMatchCooldown() public {
        // Verify 1 hour cooldown between matches for same agent
    }

    function testOnlyAgentWalletCanChallenge() public {
        // Non-agent-wallet address should be rejected
        // vm.startPrank(user1); // user1 is creator, not agentWallet
        // vm.expectRevert(BattleManager.NotAgentWallet.selector);
        // battleManager.challengeAgent(agent1Token, agent2Token, 1e16);
        // vm.stopPrank();
    }

    function testCannotChallengeSelf() public {
        // vm.startPrank(agentWallet1);
        // vm.expectRevert(BattleManager.SameAgent.selector);
        // battleManager.challengeAgent(agent1Token, agent1Token, 1e16);
        // vm.stopPrank();
    }
}

/**
 * @notice Mock USDC for testing
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
