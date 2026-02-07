import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { gambitHookAbi } from './abis/gambit-hook.abi.js';
import { ClaimRewardsParams, GetClaimableParams } from './parameters.js';

export class GambitHookService {
  private contractAddress: `0x${string}`;

  constructor(contractAddress: `0x${string}`) {
    this.contractAddress = contractAddress;
  }

  @Tool({
    description:
      'Claim accumulated swap fee rewards for a specific currency from the GambitHook',
  })
  async claimRewards(
    walletClient: EVMWalletClient,
    parameters: ClaimRewardsParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: gambitHookAbi as any,
      functionName: 'claim',
      args: [parameters.currency],
    });
    return `Rewards claimed. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Check the amount of claimable swap fee rewards for an account and currency',
  })
  async getClaimable(
    walletClient: EVMWalletClient,
    parameters: GetClaimableParams,
  ): Promise<string> {
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: gambitHookAbi as any,
      functionName: 'getClaimable',
      args: [parameters.account, parameters.currency],
    });
    return `Claimable amount: ${String(result.value)} (base units)`;
  }
}
