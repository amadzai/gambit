// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentFactory.sol";
import "../src/BattleManager.sol";
import "../src/GambAItHook.sol";
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
    GambAItHook public hook;
    MockUSDC public usdc;
    IPoolManager public poolManager;
    IPositionManager public positionManager;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public treasury = address(0x3);
    address public resultSigner = address(0x4);

    uint256 public constant CREATION_FEE = 100e6; // 100 USDC

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Note: In a real test, you'd deploy actual PoolManager and PositionManager
        // For hackathon, these would need to be deployed or mocked
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
        hook = new GambAItHook(
            poolManager,
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
        // But shows the expected flow
        // address agentToken = factory.createAgent("TestAgent", "TAGENT", CREATION_FEE);

        // assertTrue(factory.getAgentInfo(agentToken).exists);
        // assertGt(factory.getAgentInfo(agentToken).positionId, 0);
        vm.stopPrank();
    }

    function testRegisterMatch() public {
        // Would need two created agents
        // address agent1 = ...;
        // address agent2 = ...;

        // bytes32 matchId = battleManager.registerMatch(agent1, agent2);
        // assertTrue(matchId != bytes32(0));

        // BattleManager.Match memory matchData = battleManager.getMatch(matchId);
        // assertEq(uint256(matchData.status), uint256(BattleManager.MatchStatus.InProgress));
    }

    function testSettleMatch() public {
        // Would need a registered match and signature from resultSigner
        // Test signature verification and LP transfer
    }

    function testCancelExpiredMatch() public {
        // Register a match, wait > 24 hours, cancel
        // vm.warp(block.timestamp + 25 hours);
        // battleManager.cancelExpiredMatch(matchId);
    }

    function testAgentStats() public {
        // Verify stats are updated after match settlement
    }

    function testHookFeeDistribution() public {
        // Test that hook correctly splits fees 3%/2%
    }

    function testMinLiquidityFloor() public {
        // Ensure agents can't go below minimum liquidity
    }

    function testMatchCooldown() public {
        // Verify 1 hour cooldown between matches
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
