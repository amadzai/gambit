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
    console.log(
      `[GambitHook] claimRewards called — currency=${parameters.currency}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: gambitHookAbi as any,
        functionName: 'claim',
        args: [parameters.currency],
      });
      console.log(`[GambitHook] claimRewards tx sent — hash=${hash}`);
      return `Rewards claimed. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[GambitHook] claimRewards failed: ${msg}`);
      return `Claim rewards failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Check the amount of claimable swap fee rewards for an account and currency',
  })
  async getClaimable(
    walletClient: EVMWalletClient,
    parameters: GetClaimableParams,
  ): Promise<string> {
    console.log(
      `[GambitHook] getClaimable called — account=${parameters.account}, currency=${parameters.currency}, contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: gambitHookAbi as any,
        functionName: 'getClaimable',
        args: [parameters.account, parameters.currency],
      });
      const output = `Claimable amount: ${String(result.value)} (base units)`;
      console.log(`[GambitHook] getClaimable result: ${output}`);
      return output;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[GambitHook] getClaimable failed: ${msg}`);
      return `Get claimable failed: ${msg}`;
    }
  }
}
