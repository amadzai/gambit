import { type Chain, PluginBase } from '@goat-sdk/core';
import { AgentFactoryService } from './agent-factory.service.js';
import { MatchEngineService } from './match-engine.service.js';
import { GambitHookService } from './gambit-hook.service.js';
import { BASE_SEPOLIA_CHAIN_ID } from '../../constants/contracts.js';

export type GambitPluginOptions = {
  agentFactoryAddress: `0x${string}`;
  matchEngineAddress: `0x${string}`;
  gambitHookAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
  poolSwapTestAddress: `0x${string}`;
};

export class GambitPlugin extends PluginBase {
  constructor(options: GambitPluginOptions) {
    super('gambait', [
      new AgentFactoryService(
        options.agentFactoryAddress,
        options.usdcAddress,
        options.poolSwapTestAddress,
      ),
      new MatchEngineService(options.matchEngineAddress),
      new GambitHookService(options.gambitHookAddress),
    ]);
  }

  supportsChain = (chain: Chain) =>
    chain.type === 'evm' && chain.id === BASE_SEPOLIA_CHAIN_ID;
}

export function gambit(options: GambitPluginOptions): GambitPlugin {
  return new GambitPlugin(options);
}
