import { type Chain, PluginBase } from '@goat-sdk/core';
import { Erc20WalletService } from './erc20-wallet.service.js';
import { BASE_SEPOLIA_CHAIN_ID } from '../../constants/contracts.js';

export type Erc20WalletPluginOptions = {
  usdcAddress: `0x${string}`;
};

export class Erc20WalletPlugin extends PluginBase {
  constructor(options: Erc20WalletPluginOptions) {
    super('erc20-wallet', [new Erc20WalletService(options.usdcAddress)]);
  }

  supportsChain = (chain: Chain) =>
    chain.type === 'evm' && chain.id === BASE_SEPOLIA_CHAIN_ID;
}

export function erc20Wallet(options: Erc20WalletPluginOptions) {
  return new Erc20WalletPlugin(options);
}
