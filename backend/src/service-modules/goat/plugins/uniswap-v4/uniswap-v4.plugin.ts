import { type Chain, PluginBase } from '@goat-sdk/core';
import { SwapService } from './swap.service.js';
import { PositionService } from './position.service.js';
import { BASE_SEPOLIA_CHAIN_ID } from '../../constants/contracts.js';

export type UniswapV4PluginOptions = {
  hookAddress: `0x${string}`;
  poolFee?: number;
  tickSpacing?: number;
};

export class UniswapV4Plugin extends PluginBase {
  constructor(options: UniswapV4PluginOptions) {
    super('uniswap-v4-base-sepolia', [
      new SwapService(
        options.hookAddress,
        options.poolFee,
        options.tickSpacing,
      ),
      new PositionService(
        options.hookAddress,
        options.poolFee,
        options.tickSpacing,
      ),
    ]);
  }

  supportsChain = (chain: Chain) =>
    chain.type === 'evm' && chain.id === BASE_SEPOLIA_CHAIN_ID;
}

export function uniswapV4(options: UniswapV4PluginOptions): UniswapV4Plugin {
  return new UniswapV4Plugin(options);
}
