import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { positionManagerAbi } from './abis/position-manager.abi.js';
import {
  GetPositionInfoParams,
  IncreaseLiquidityParams,
  DecreaseLiquidityParams,
  CollectFeesParams,
} from './parameters.js';
import { UNISWAP_V4 } from '../../constants/contracts.js';
import { Abi, encodePacked, encodeAbiParameters } from 'viem';

// Uniswap V4 PositionManager action constants
const INCREASE_LIQUIDITY = 2;
const DECREASE_LIQUIDITY = 3;
const SETTLE_PAIR = 16;
const TAKE_PAIR = 18;
const CLOSE_CURRENCY = 19;

// ERC20 approve function selector
const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

const MAX_UINT256 = 2n ** 256n - 1n;

export class PositionService {
  private hookAddress: `0x${string}`;
  private poolFee: number;
  private tickSpacing: number;

  constructor(hookAddress: `0x${string}`, poolFee = 3000, tickSpacing = 60) {
    this.hookAddress = hookAddress;
    this.poolFee = poolFee;
    this.tickSpacing = tickSpacing;
  }

  private getDeadline(): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  }

  private encodeUnlockData(
    actions: number[],
    params: `0x${string}`[],
  ): `0x${string}` {
    const actionBytes = encodePacked(
      actions.map(() => 'uint8' as const),
      actions,
    );

    const encoded = encodeAbiParameters(
      [
        { type: 'bytes', name: 'actions' },
        { type: 'bytes[]', name: 'params' },
      ],
      [actionBytes, params],
    );

    return encoded;
  }

  private async readPositionInfo(
    walletClient: EVMWalletClient,
    tokenId: bigint,
  ) {
    const result = await walletClient.read({
      address: UNISWAP_V4.POSITION_MANAGER,
      abi: positionManagerAbi as Abi,
      functionName: 'getPositionInfo',
      args: [tokenId],
    });

    const [poolKey, tickLower, tickUpper, liquidity] = result.value as [
      {
        currency0: string;
        currency1: string;
        fee: number;
        tickSpacing: number;
        hooks: string;
      },
      number,
      number,
      bigint,
    ];

    return { poolKey, tickLower, tickUpper, liquidity };
  }

  @Tool({
    description:
      'Get LP position details (liquidity, tick range, pool) for a Uniswap V4 position on Base Sepolia',
  })
  async getPositionInfo(
    walletClient: EVMWalletClient,
    parameters: GetPositionInfoParams,
  ): Promise<string> {
    console.log(
      `[UniswapV4] getPositionInfo called — tokenId=${parameters.tokenId}`,
    );
    try {
      const tokenId = BigInt(parameters.tokenId);
      const { poolKey, tickLower, tickUpper, liquidity } =
        await this.readPositionInfo(walletClient, tokenId);

      const output = JSON.stringify(
        {
          tokenId: parameters.tokenId,
          currency0: poolKey.currency0,
          currency1: poolKey.currency1,
          fee: poolKey.fee,
          tickSpacing: poolKey.tickSpacing,
          hooks: poolKey.hooks,
          tickLower,
          tickUpper,
          liquidity: liquidity.toString(),
        },
        null,
        2,
      );
      console.log(`[UniswapV4] getPositionInfo result: ${output}`);
      return output;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[UniswapV4] getPositionInfo failed: ${msg}`);
      return `Get position info failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Increase liquidity of an existing Uniswap V4 LP position on Base Sepolia',
  })
  async increaseLiquidity(
    walletClient: EVMWalletClient,
    parameters: IncreaseLiquidityParams,
  ): Promise<string> {
    console.log(
      `[UniswapV4] increaseLiquidity called — tokenId=${parameters.tokenId}, amount0=${parameters.amount0Desired}, amount1=${parameters.amount1Desired}`,
    );
    try {
      const tokenId = BigInt(parameters.tokenId);
      const amount0Desired = BigInt(parameters.amount0Desired);
      const amount1Desired = BigInt(parameters.amount1Desired);

      const { poolKey } = await this.readPositionInfo(walletClient, tokenId);

      // Approve both tokens to PositionManager
      await walletClient.sendTransaction({
        to: poolKey.currency0 as `0x${string}`,
        abi: ERC20_APPROVE_ABI as Abi,
        functionName: 'approve',
        args: [UNISWAP_V4.POSITION_MANAGER, MAX_UINT256],
      });
      await walletClient.sendTransaction({
        to: poolKey.currency1 as `0x${string}`,
        abi: ERC20_APPROVE_ABI as Abi,
        functionName: 'approve',
        args: [UNISWAP_V4.POSITION_MANAGER, MAX_UINT256],
      });

      // Encode INCREASE_LIQUIDITY action
      const increaseParam = encodeAbiParameters(
        [
          { type: 'uint256', name: 'tokenId' },
          { type: 'uint256', name: 'liquidity' },
          { type: 'uint128', name: 'amount0Max' },
          { type: 'uint128', name: 'amount1Max' },
          { type: 'bytes', name: 'hookData' },
        ],
        [tokenId, amount0Desired, amount0Desired, amount1Desired, '0x'],
      );

      // Encode CLOSE_CURRENCY for each token
      const closeCurrency0 = encodeAbiParameters(
        [{ type: 'address', name: 'currency' }],
        [poolKey.currency0 as `0x${string}`],
      );
      const closeCurrency1 = encodeAbiParameters(
        [{ type: 'address', name: 'currency' }],
        [poolKey.currency1 as `0x${string}`],
      );

      const unlockData = this.encodeUnlockData(
        [INCREASE_LIQUIDITY, CLOSE_CURRENCY, CLOSE_CURRENCY],
        [increaseParam, closeCurrency0, closeCurrency1],
      );

      const { hash } = await walletClient.sendTransaction({
        to: UNISWAP_V4.POSITION_MANAGER,
        abi: positionManagerAbi as Abi,
        functionName: 'modifyLiquidities',
        args: [unlockData, this.getDeadline()],
      });
      console.log(`[UniswapV4] increaseLiquidity tx sent — hash=${hash}`);
      return `Liquidity increased. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[UniswapV4] increaseLiquidity failed: ${msg}`);
      return `Increase liquidity failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Decrease liquidity of an existing Uniswap V4 LP position on Base Sepolia',
  })
  async decreaseLiquidity(
    walletClient: EVMWalletClient,
    parameters: DecreaseLiquidityParams,
  ): Promise<string> {
    console.log(
      `[UniswapV4] decreaseLiquidity called — tokenId=${parameters.tokenId}, liquidityAmount=${parameters.liquidityAmount}`,
    );
    try {
      const tokenId = BigInt(parameters.tokenId);
      const liquidityAmount = BigInt(parameters.liquidityAmount);
      const amount0Min = BigInt(parameters.amount0Min);
      const amount1Min = BigInt(parameters.amount1Min);

      const { poolKey } = await this.readPositionInfo(walletClient, tokenId);

      // Encode DECREASE_LIQUIDITY action
      const decreaseParam = encodeAbiParameters(
        [
          { type: 'uint256', name: 'tokenId' },
          { type: 'uint256', name: 'liquidity' },
          { type: 'uint128', name: 'amount0Min' },
          { type: 'uint128', name: 'amount1Min' },
          { type: 'bytes', name: 'hookData' },
        ],
        [tokenId, liquidityAmount, amount0Min, amount1Min, '0x'],
      );

      // Encode TAKE_PAIR to receive tokens
      const takePairParam = encodeAbiParameters(
        [
          { type: 'address', name: 'currency0' },
          { type: 'address', name: 'currency1' },
        ],
        [poolKey.currency0 as `0x${string}`, poolKey.currency1 as `0x${string}`],
      );

      const unlockData = this.encodeUnlockData(
        [DECREASE_LIQUIDITY, TAKE_PAIR],
        [decreaseParam, takePairParam],
      );

      const { hash } = await walletClient.sendTransaction({
        to: UNISWAP_V4.POSITION_MANAGER,
        abi: positionManagerAbi as Abi,
        functionName: 'modifyLiquidities',
        args: [unlockData, this.getDeadline()],
      });
      console.log(`[UniswapV4] decreaseLiquidity tx sent — hash=${hash}`);
      return `Liquidity decreased. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[UniswapV4] decreaseLiquidity failed: ${msg}`);
      return `Decrease liquidity failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Collect accumulated fees from a Uniswap V4 LP position on Base Sepolia (decreases with zero liquidity)',
  })
  async collectFees(
    walletClient: EVMWalletClient,
    parameters: CollectFeesParams,
  ): Promise<string> {
    console.log(
      `[UniswapV4] collectFees called — tokenId=${parameters.tokenId}`,
    );
    try {
      const tokenId = BigInt(parameters.tokenId);

      const { poolKey } = await this.readPositionInfo(walletClient, tokenId);

      // Decrease with 0 liquidity to collect fees only
      const decreaseParam = encodeAbiParameters(
        [
          { type: 'uint256', name: 'tokenId' },
          { type: 'uint256', name: 'liquidity' },
          { type: 'uint128', name: 'amount0Min' },
          { type: 'uint128', name: 'amount1Min' },
          { type: 'bytes', name: 'hookData' },
        ],
        [tokenId, 0n, 0n, 0n, '0x'],
      );

      // Encode TAKE_PAIR to receive fee tokens
      const takePairParam = encodeAbiParameters(
        [
          { type: 'address', name: 'currency0' },
          { type: 'address', name: 'currency1' },
        ],
        [poolKey.currency0 as `0x${string}`, poolKey.currency1 as `0x${string}`],
      );

      const unlockData = this.encodeUnlockData(
        [DECREASE_LIQUIDITY, TAKE_PAIR],
        [decreaseParam, takePairParam],
      );

      const { hash } = await walletClient.sendTransaction({
        to: UNISWAP_V4.POSITION_MANAGER,
        abi: positionManagerAbi as Abi,
        functionName: 'modifyLiquidities',
        args: [unlockData, this.getDeadline()],
      });
      console.log(`[UniswapV4] collectFees tx sent — hash=${hash}`);
      return `Fees collected. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[UniswapV4] collectFees failed: ${msg}`);
      return `Collect fees failed: ${msg}`;
    }
  }
}
