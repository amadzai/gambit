Single Swap
Swap between tokens on a single pool
Swapping will typically make use of a periphery contract. It is not recommended to directly swap with poolManager.swap

Using the v4-core provided test router, we can swap on a single pool. These snippets should only be used for non-production, testing purposes

Swapping involves 3 primary arguments:

Which pool to swap on
The direction of the swap, token0 -> token1 or token1 -> token0
The input token amount
exact-input: amountSpecified is negative -- users provide an exact amount of input tokens

exact-output: amountSpecified is positive -- users expect an exact amount of output tokens

Expect Uniswap Labs to release an official contract around launch

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";

contract Swap {
    // set the router address
    PoolSwapTest swapRouter = PoolSwapTest(address(0x01));

    // slippage tolerance to allow for unlimited price impact
    uint160 public constant MIN_PRICE_LIMIT = TickMath.MIN_SQRT_PRICE + 1;
    uint160 public constant MAX_PRICE_LIMIT = TickMath.MAX_SQRT_PRICE - 1;

    /// @notice Swap tokens
    /// @param key the pool where the swap is happening
    /// @param amountSpecified the amount of tokens to swap. Negative is an exact-input swap
    /// @param zeroForOne whether the swap is token0 -> token1 or token1 -> token0
    /// @param hookData any data to be passed to the pool's hook
    function swap(PoolKey memory key, int256 amountSpecified, bool zeroForOne, bytes memory hookData) internal {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: amountSpecified,
            sqrtPriceLimitX96: zeroForOne ? MIN_PRICE_LIMIT : MAX_PRICE_LIMIT // unlimited impact
        });

        // in v4, users have the option to receieve native ERC20s or wrapped ERC6909 tokens
        // here, we'll take the ERC20s
        PoolSwapTest.TestSettings memory testSettings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});

        swapRouter.swap(key, params, testSettings, hookData);
    }
}
Examples of Swapping on a V4 Pool

PoolSwapTest swapRouter = PoolSwapTest(0x01);

// slippage tolerance to allow for unlimited price impact
uint160 public constant MIN_PRICE_LIMIT = TickMath.MIN_SQRT_PRICE + 1;
uint160 public constant MAX_PRICE_LIMIT = TickMath.MAX_SQRT_PRICE - 1;

address token0 = address(0x11);
address token1 = address(0x22);
address hookAddr = address(0x33);

PoolKey memory pool = PoolKey({
    currency0: Currency.wrap(token0),
    currency1: Currency.wrap(token1),
    fee: 3000,
    tickSpacing: 60,
    hooks: IHooks(hookAddr)
});

// approve tokens to the swap router
IERC20(token0).approve(address(swapRouter), type(uint256).max);
IERC20(token1).approve(address(swapRouter), type(uint256).max);

// ---------------------------- //
// Swap exactly 1e18 of token0 into token1
// ---------------------------- //
bool zeroForOne = true;
IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
    zeroForOne: zeroForOne,
    amountSpecified: -1e18,
    sqrtPriceLimitX96: zeroForOne ? MIN_PRICE_LIMIT : MAX_PRICE_LIMIT // unlimited impact
});

// in v4, users have the option to receieve native ERC20s or wrapped ERC1155 tokens
// here, we'll take the ERC20s
PoolSwapTest.TestSettings memory testSettings =
    PoolSwapTest.TestSettings({withdrawTokens: true, settleUsingTransfer: true});

bytes memory hookData = new bytes(0); // no hook data on the hookless pool
swapRouter.swap(key, params, testSettings, hookData);
