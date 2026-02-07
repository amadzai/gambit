// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/AgentFactory.sol";
import "../src/BattleManager.sol";
import "../src/GambitHook.sol";

/**
 * @title Deploy
 * @notice Deploys all Gambit contracts to Base Sepolia
 *
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url base_sepolia \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Required environment variables:
 *   PRIVATE_KEY       - Deployer private key
 *   RESULT_SIGNER     - Backend wallet address for signing match results
 *   TREASURY          - Protocol treasury address
 *
 * Optional environment variables:
 *   USDC_ADDRESS      - Existing USDC address (if not set, deploys MockUSDC)
 *   CREATION_FEE      - Agent creation fee in USDC units (default: 100e6 = 100 USDC)
 */
contract Deploy is Script {
    // ──────────────────────────────────────────────
    // Base Sepolia Uniswap V4 addresses
    // ──────────────────────────────────────────────
    address constant POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
    address constant POSITION_MANAGER = 0x4B2C77d209D3405F41a037Ec6c77F7F5b8e2ca80;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address resultSigner = vm.envAddress("RESULT_SIGNER");
        address treasury = vm.envAddress("TREASURY");
        uint256 creationFee = vm.envOr("CREATION_FEE", uint256(100e6));

        vm.startBroadcast(deployerPrivateKey);

        // ── 1. USDC ──────────────────────────────
        address usdc;
        if (vm.envOr("USDC_ADDRESS", address(0)) != address(0)) {
            usdc = vm.envAddress("USDC_ADDRESS");
            console.log("Using existing USDC:", usdc);
        } else {
            MockUSDC mockUsdc = new MockUSDC();
            usdc = address(mockUsdc);
            console.log("Deployed MockUSDC:", usdc);
        }

        // ── 2. AgentFactory ──────────────────────
        AgentFactory factory = new AgentFactory(
            usdc,
            POOL_MANAGER,
            POSITION_MANAGER,
            creationFee
        );
        console.log("Deployed AgentFactory:", address(factory));

        // ── 3. GambitHook ────────────────────────
        GambitHook hook = new GambitHook(
            POOL_MANAGER,
            address(factory),
            usdc,
            treasury
        );
        console.log("Deployed GambitHook:", address(hook));

        // ── 4. BattleManager ─────────────────────
        BattleManager battleManager = new BattleManager(
            address(factory),
            POOL_MANAGER,
            POSITION_MANAGER,
            resultSigner
        );
        console.log("Deployed BattleManager:", address(battleManager));

        // ── 5. Configure AgentFactory ────────────
        factory.setHookAddress(address(hook));
        console.log("Set hook address on AgentFactory");

        factory.setBattleManager(address(battleManager));
        console.log("Set BattleManager on AgentFactory");

        vm.stopBroadcast();

        // ── Summary ──────────────────────────────
        console.log("");
        console.log("=== Deployment Summary (Base Sepolia) ===");
        console.log("USDC:           ", usdc);
        console.log("AgentFactory:   ", address(factory));
        console.log("GambitHook:     ", address(hook));
        console.log("BattleManager:  ", address(battleManager));
        console.log("Result Signer:  ", resultSigner);
        console.log("Treasury:       ", treasury);
        console.log("Creation Fee:   ", creationFee);
        console.log("Pool Manager:   ", POOL_MANAGER);
        console.log("Position Mgr:   ", POSITION_MANAGER);
    }
}
