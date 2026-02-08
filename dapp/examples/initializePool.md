Initialize a Pool
Create a Uniswap v4 Pool
A single trading pair (ETH/USDC), can exist as an infinite number of pools in v4. Uniswap v4 does not restrict fee tiers to 1%, 0.30%, or 0.05%. A trading pair exists as many pools, but one pool has one hook contract

In V4, pools are initialized and managed by a single contract: PoolManager

Think of a PoolKey as the unique identifier for a pool, i.e. like a v3 pair's contract address

Creating a Pool is determined by 5 primary arguments:

Trading pair currency0, currency1
Fee tier
Tick spacing
Hook
Starting Price

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";

contract PoolInitialize {
    using CurrencyLibrary for Currency;

    // set the initialize router
    IPoolManager manager = IPoolManager(address(0x01));

    function init(
        address token0,
        address token1,
        uint24 swapFee,
        int24 tickSpacing,
        address hook,
        uint160 sqrtPriceX96,
        bytes calldata hookData
    ) external {
        // sort your tokens! v4 requires token0 < token1
        if (token0 > token1) {
            (token0, token1) = (token1, token0);
        }

        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: swapFee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });
        manager.initialize(pool, sqrtPriceX96, hookData);
    }
}
Examples of Initializing a V4 Pool
Hooks are not mandatory, you can create a pool without a hook


IPoolManager manager = IPoolManager(0x01);

address token0 = address(0x11);
address token1 = address(0x22);
uint24 swapFee = 500; // 0.05% fee tier
int24 tickSpacing = 10;

// floor(sqrt(1) * 2^96)
uint160 startingPrice = 79228162514264337593543950336;

// hookless pool doesnt expect any initialization data
bytes memory hookData = new bytes(0);

PoolKey memory pool = PoolKey({
    currency0: Currency.wrap(token0),
    currency1: Currency.wrap(token1),
    fee: swapFee,
    tickSpacing: tickSpacing,
    hooks: IHooks(address(0x0)) // !!! Hookless pool is address(0x0)
});
manager.initialize(pool, startingPrice, hookData);
Some hooks may require initialization data, i.e. block.timestamp


IPoolManager manager = IPoolManager(0x01);

address hook = address(0x80); // prefix indicates the hook only has a beforeInitialize() function
address token0 = address(0x11);
address token1 = address(0x22);
uint24 swapFee = 3000; // 0.30% fee tier
int24 tickSpacing = 60;

// floor(sqrt(1) * 2^96)
uint160 startingPrice = 79228162514264337593543950336;

// Assume the custom hook requires a timestamp when initializing it
bytes memory hookData = abi.encode(block.timestamp);

PoolKey memory pool = PoolKey({
    currency0: Currency.wrap(token0),
    currency1: Currency.wrap(token1),
    fee: swapFee,
    tickSpacing: tickSpacing,
    hooks: IHooks(hook)
});
manager.initialize(pool, startingPrice, hookData);
