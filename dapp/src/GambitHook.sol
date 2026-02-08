// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "v4-core/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "v4-core/types/BeforeSwapDelta.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentFactory.sol";

/**
 * @title GambAItHook
 * @notice Uniswap V4 hook that splits swap fees: 3% to agent creator, 2% to protocol treasury
 * @dev Implements afterSwap hook to capture 5% of swap output and distribute fees
 */
contract GambitHook is IHooks, Ownable {
    using CurrencyLibrary for Currency;
    using BalanceDeltaLibrary for BalanceDelta;

    /// @notice Pool Manager
    IPoolManager public immutable poolManager;

    /// @notice AgentFactory contract to look up agent creators
    AgentFactory public immutable agentFactory;

    /// @notice USDC token (used to identify agent tokens)
    IERC20 public immutable usdc;

    /// @notice Protocol treasury address
    address public treasury;

    /// @notice Fee percentages (basis points)
    uint256 public constant CREATOR_FEE_BPS = 300;  // 3%
    uint256 public constant PROTOCOL_FEE_BPS = 200; // 2%
    uint256 public constant TOTAL_FEE_BPS = 500;    // 5%

    /// @notice Accumulated claimable fees per address per currency
    mapping(address => mapping(Currency => uint256)) public claimable;

    event FeesAccumulated(address indexed recipient, Currency indexed currency, uint256 amount);
    event FeesClaimed(address indexed claimer, Currency indexed currency, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);

    error InvalidAddress();
    error NoFeesToClaim();
    error TransferFailed();
    error NotPoolManager();
    error HookNotImplemented();

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    /**
     * @notice Deploy the GambAItHook
     * @param _poolManager Uniswap V4 PoolManager
     * @param _agentFactory AgentFactory contract
     * @param _usdc USDC token address
     * @param _treasury Protocol treasury address
     */
    constructor(
        address _poolManager,
        address payable _agentFactory,
        address _usdc,
        address _treasury
    ) Ownable(msg.sender) {
        if (_poolManager == address(0) || _agentFactory == address(0) || _usdc == address(0) || _treasury == address(0)) {
            revert InvalidAddress();
        }
        poolManager = IPoolManager(_poolManager);
        agentFactory = AgentFactory(_agentFactory);
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    /**
     * @notice Hook called after every swap
     * @dev Takes 5% of swap output: 3% to creator, 2% to treasury
     */
    function afterSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) external onlyPoolManager returns (bytes4, int128) {
        // Determine which currency is the agent token (not USDC)
        address agentToken;
        Currency outputCurrency;
        int128 outputAmount;

        if (Currency.unwrap(key.currency0) == address(usdc)) {
            // Agent token is currency1
            agentToken = Currency.unwrap(key.currency1);
            // If zeroForOne, output is currency1, else output is currency0
            if (params.zeroForOne) {
                outputCurrency = key.currency1;
                outputAmount = delta.amount1();
            } else {
                outputCurrency = key.currency0;
                outputAmount = delta.amount0();
            }
        } else {
            // Agent token is currency0
            agentToken = Currency.unwrap(key.currency0);
            // If zeroForOne, output is currency1, else output is currency0
            if (params.zeroForOne) {
                outputCurrency = key.currency1;
                outputAmount = delta.amount1();
            } else {
                outputCurrency = key.currency0;
                outputAmount = delta.amount0();
            }
        }

        // Output amount is negative (sent to user), we take a positive fee
        if (outputAmount >= 0) {
            // No output, no fee
            return (IHooks.afterSwap.selector, 0);
        }

        // Calculate absolute output amount (outputAmount is negative)
        uint256 absOutputAmount = uint256(int256(-outputAmount));

        // Calculate 5% fee
        uint256 totalFee = (absOutputAmount * TOTAL_FEE_BPS) / 10000;
        if (totalFee == 0) {
            return (IHooks.afterSwap.selector, 0);
        }

        // Split: 3% creator, 2% protocol
        uint256 creatorFee = (absOutputAmount * CREATOR_FEE_BPS) / 10000;
        uint256 protocolFee = totalFee - creatorFee;

        // Look up agent creator
        AgentFactory.AgentInfo memory agentInfo = agentFactory.getAgentInfo(agentToken);

        if (agentInfo.exists && agentInfo.creator != address(0)) {
            // Accumulate fees
            claimable[agentInfo.creator][outputCurrency] += creatorFee;
            claimable[treasury][outputCurrency] += protocolFee;

            emit FeesAccumulated(agentInfo.creator, outputCurrency, creatorFee);
            emit FeesAccumulated(treasury, outputCurrency, protocolFee);

            // Return total fee as int128 (hook takes this from output)
            return (IHooks.afterSwap.selector, int128(int256(totalFee)));
        }

        // If agent doesn't exist, don't take fee
        return (IHooks.afterSwap.selector, 0);
    }

    /**
     * @notice Claim accumulated fees for a currency
     * @param currency Currency to claim
     */
    function claim(Currency currency) external {
        uint256 amount = claimable[msg.sender][currency];
        if (amount == 0) revert NoFeesToClaim();

        claimable[msg.sender][currency] = 0;

        // Transfer tokens from pool manager to claimer
        poolManager.take(currency, msg.sender, amount);

        emit FeesClaimed(msg.sender, currency, amount);
    }

    /**
     * @notice Update treasury address (owner only)
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /**
     * @notice Get claimable amount for an address and currency
     * @param account Account to check
     * @param currency Currency to check
     * @return Claimable amount
     */
    function getClaimable(address account, Currency currency) external view returns (uint256) {
        return claimable[account][currency];
    }

    // Required IHooks implementations (not used)
    function beforeInitialize(address, PoolKey calldata, uint160) external pure returns (bytes4) {
        revert HookNotImplemented();
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure returns (bytes4) {
        revert HookNotImplemented();
    }

    function beforeAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        revert HookNotImplemented();
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        revert HookNotImplemented();
    }

    function beforeRemoveLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        revert HookNotImplemented();
    }

    function afterRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        revert HookNotImplemented();
    }

    function beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        pure
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        revert HookNotImplemented();
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        revert HookNotImplemented();
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        revert HookNotImplemented();
    }
}
