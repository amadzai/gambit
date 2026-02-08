Create Liquidity
Provide Liquidity to a Uniswap v4 Pool
Creating liquidity involves using periphery contracts. It is not recommended to directly provide liquidity with poolManager.modifyPosition

Using the provided test router, we can provide liquidity to a pool. These snippets should only be used for non-production, testing purposes

(⚠️ Using the test router in production will lead to a loss of funds ⚠️ )

Providing liquidity involves 3 primary arguments:

Which pool to LP on
The range of the the liquidity, i.e. the upper and lower bounds
A liquidity value that determines input token amounts
Please see LiquidityAmounts for calculating the liquidity value

Expect Uniswap Labs to release an official contract around launch

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";

contract CreateLiquidity {
    // set the router address
    PoolModifyLiquidityTest lpRouter = PoolModifyLiquidityTest(address(0x01));

    function createLiquidity(
        PoolKey memory poolKey,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidity,
        bytes calldata hookData
    ) external {
        // if 0 < liquidity: add liquidity -- otherwise remove liquidity
        lpRouter.modifyLiquidity(
            poolKey,
            IPoolManager.ModifyLiquidityParams({
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: liquidity,
                salt: 0
            }),
            hookData
        );
    }
}
Examples of Providing Liquidity to a V4 Pool

import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";

PoolModifyLiquidityTest lpRouter = PoolModifyLiquidityTest(0x01);
address token0 = address(0x11);
address token1 = address(0x22);
address hookAddress = address(0x80);

// Pool that will receieve liquidity
PoolKey memory pool = PoolKey({
    currency0: Currency.wrap(token0),
    currency1: Currency.wrap(token1),
    fee: 3000,
    tickSpacing: 60,
    hooks: IHooks(hookAddress)
});

// approve tokens to the LP Router
IERC20(token0).approve(address(lpRouter), type(uint256).max);
IERC20(token1).approve(address(lpRouter), type(uint256).max);

// Provide 10e18 worth of liquidity on the range of [-600, 600]
int24 tickLower = -600;
int24 tickUpper = 600;
int256 liquidity = 10e18;
lpRouter.modifyLiquidity(
    poolKey,
    IPoolManager.ModifyLiquidityParams({tickLower: tickLower, tickUpper: tickUpper, liquidityDelta: liquidity, salt: 0}),
    new bytes(0)
);
A note on salt, the test router optionally allows EOAs to specify a salt. In production, the salt will not exposed to the user. The salt allows position managers to distinguish same-range positions for independent users. Distinguishing same-range positions is important for hooks with AFTER_ADD_LIQUIDITY_RETURNS_DELTA_FLAG and AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA_FLAG where hooks may charge fees and/or penalize liquidity addition/removal. For 90%+ of use-cases, you should use a shared salt for warm-storage gas savings
