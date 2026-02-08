// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentFactory.sol";
import "../src/MatchEngine.sol";
import "../src/GambitHook.sol";
import "../src/AgentToken.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GambAItTest
 * @notice Tests for Gambit smart contracts (MatchEngine + AgentFactory)
 */
contract GambAItTest is Test {
    AgentFactory public factory;
    MatchEngine public matchEngine;
    GambitHook public hook;
    MockUSDC public usdc;
    IPoolManager public poolManager;
    IPositionManager public positionManager;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public treasury = address(0x3);
    uint256 public resultSignerPk = 0xBEEF;
    address public resultSigner;
    address public agentWallet1 = address(0x5);
    address public agentWallet2 = address(0x6);

    uint256 public constant CREATION_FEE = 100e6; // 100 USDC

    function setUp() public {
        resultSigner = vm.addr(resultSignerPk);

        // Deploy mock USDC
        usdc = new MockUSDC();

        // For now, use mock addresses (tests requiring actual Uniswap will be commented)
        poolManager = IPoolManager(address(0x100));
        positionManager = IPositionManager(address(0x200));

        // Deploy contracts
        factory = new AgentFactory(
            address(usdc),
            address(poolManager),
            address(positionManager),
            CREATION_FEE
        );

        // Fund factory with ETH for agent wallet gas funding
        vm.deal(address(this), 10 ether);
        factory.depositEth{value: 1 ether}();

        matchEngine = new MatchEngine(
            payable(address(factory)),
            address(usdc),
            resultSigner
        );

        // Set match engine
        factory.setMatchEngine(address(matchEngine));

        // Deploy hook
        hook = new GambitHook(
            address(poolManager),
            payable(address(factory)),
            address(usdc),
            treasury
        );

        factory.setHookAddress(address(hook));

        // Fund test users
        usdc.mint(user1, 1000e6);
        usdc.mint(user2, 1000e6);
        // Fund agent wallets with USDC for staking
        usdc.mint(agentWallet1, 500e6);
        usdc.mint(agentWallet2, 500e6);
    }

    // ─── AgentFactory Tests ─────────────────────

    function testFactoryDeployment() public view {
        assertEq(address(factory.usdc()), address(usdc));
        assertEq(factory.creationFee(), CREATION_FEE);
        assertEq(factory.matchEngine(), address(matchEngine));
    }

    function testDepositEth() public {
        uint256 balBefore = address(factory).balance;
        factory.depositEth{value: 0.5 ether}();
        assertEq(address(factory).balance, balBefore + 0.5 ether);
    }

    function testWithdrawEth() public {
        uint256 ownerBalBefore = address(this).balance;
        uint256 factoryBal = address(factory).balance;
        factory.withdrawEth(0.5 ether);
        assertEq(address(factory).balance, factoryBal - 0.5 ether);
        assertEq(address(this).balance, ownerBalBefore + 0.5 ether);
    }

    function testWithdrawEthRevertsIfInsufficient() public {
        uint256 factoryBal = address(factory).balance;
        vm.expectRevert(AgentFactory.InsufficientETH.selector);
        factory.withdrawEth(factoryBal + 1);
    }

    function testReceiveEth() public {
        uint256 balBefore = address(factory).balance;
        (bool sent,) = address(factory).call{value: 0.1 ether}("");
        assertTrue(sent);
        assertEq(address(factory).balance, balBefore + 0.1 ether);
    }

    function testConstants() public view {
        assertEq(factory.LP_BPS(), 7000);
        assertEq(factory.RESERVE_BPS(), 3000);
        assertEq(factory.AGENT_ETH_FUNDING(), 0.01 ether);
    }

    function testAgentCreationRevertsWithZeroAgentWallet() public {
        vm.startPrank(user1);
        usdc.approve(address(factory), CREATION_FEE);
        vm.expectRevert(AgentFactory.InvalidAddress.selector);
        factory.createAgent("TestAgent", "TAGENT", CREATION_FEE, address(0));
        vm.stopPrank();
    }

    function testAgentCreationRevertsWithInsufficientFee() public {
        vm.startPrank(user1);
        usdc.approve(address(factory), 50e6);
        vm.expectRevert(AgentFactory.InsufficientUSDC.selector);
        factory.createAgent("TestAgent", "TAGENT", 50e6, agentWallet1);
        vm.stopPrank();
    }

    // Note: Full createAgent test needs actual PoolManager/PositionManager
    // The flow would verify:
    // - 70 USDC goes to LP (50/50 split as user LP + agent LP)
    // - 30 USDC sent to agentWallet
    // - 0.01 ETH sent to agentWallet

    // ─── MatchEngine Tests ──────────────────────

    function testMatchEngineDeployment() public view {
        assertEq(address(matchEngine.agentFactory()), address(factory));
        assertEq(address(matchEngine.usdc()), address(usdc));
        assertEq(matchEngine.resultSigner(), resultSigner);
    }

    function testChallengeRevertsWithInvalidAgent() public {
        // Non-existent agent tokens
        vm.startPrank(agentWallet1);
        vm.expectRevert(MatchEngine.InvalidAgent.selector);
        matchEngine.challenge(address(0xDEAD), address(0xBEEF), 10e6);
        vm.stopPrank();
    }

    function testChallengeRevertsSameAgent() public {
        vm.startPrank(agentWallet1);
        vm.expectRevert(MatchEngine.SameAgent.selector);
        matchEngine.challenge(address(0xDEAD), address(0xDEAD), 10e6);
        vm.stopPrank();
    }

    function testChallengeRevertsZeroStake() public {
        vm.startPrank(agentWallet1);
        vm.expectRevert(MatchEngine.InvalidStake.selector);
        matchEngine.challenge(address(0xDEAD), address(0xBEEF), 0);
        vm.stopPrank();
    }

    function testSetResultSigner() public {
        address newSigner = address(0x999);
        matchEngine.setResultSigner(newSigner);
        assertEq(matchEngine.resultSigner(), newSigner);
    }

    function testSetResultSignerRevertsZeroAddress() public {
        vm.expectRevert(MatchEngine.InvalidAddress.selector);
        matchEngine.setResultSigner(address(0));
    }

    function testSetMatchEngine() public {
        address newEngine = address(0x888);
        factory.setMatchEngine(newEngine);
        assertEq(factory.matchEngine(), newEngine);
    }

    // ─── Signature Helpers ──────────────────────

    function _signSettle(bytes32 matchId, address winnerToken) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            matchId,
            winnerToken,
            block.chainid,
            address(matchEngine)
        ));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(resultSignerPk, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }

    function _signCancel(bytes32 matchId) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            matchId,
            "cancel",
            block.chainid,
            address(matchEngine)
        ));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(resultSignerPk, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }

    // Note: Full integration tests for challenge → accept → settle flow
    // require actual agents created via AgentFactory with real Uniswap pools.
    // The expected flow:
    //
    // 1. User creates Agent1 (100 USDC) → 70 to LP, 30 to agentWallet1, 0.01 ETH to agentWallet1
    // 2. User creates Agent2 (100 USDC) → 70 to LP, 30 to agentWallet2, 0.01 ETH to agentWallet2
    // 3. agentWallet1 approves MatchEngine for 10 USDC
    // 4. agentWallet1 calls challenge(agent1Token, agent2Token, 10e6) → matchId
    // 5. agentWallet2 approves MatchEngine for 10 USDC
    // 6. agentWallet2 calls acceptChallenge(matchId)
    // 7. 20 USDC held in MatchEngine
    // 8. Backend signs result, anyone calls settleMatch(matchId, winnerToken, sig)
    // 9. 20 USDC sent to winner's wallet
    //
    // For draws: settleMatch(matchId, address(0), sig) → 10 USDC returned to each

    // Allow receiving ETH (for withdrawEth test)
    receive() external payable {}
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
