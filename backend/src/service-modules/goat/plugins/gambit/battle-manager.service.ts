import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { battleManagerAbi } from './abis/battle-manager.abi.js';
import {
  ChallengeAgentParams,
  AcceptChallengeParams,
  DeclineChallengeParams,
  SettleMatchParams,
  CancelExpiredMatchParams,
  GetMatchParams,
  GetAgentStatsParams,
  EmptyParams,
} from './parameters.js';
import { Abi } from 'viem';

export class BattleManagerService {
  private contractAddress: `0x${string}`;

  constructor(contractAddress: `0x${string}`) {
    this.contractAddress = contractAddress;
  }

  @Tool({
    description:
      'Challenge another AI agent to a chess battle with a staked amount of tokens',
  })
  async challengeAgent(
    walletClient: EVMWalletClient,
    parameters: ChallengeAgentParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'challengeAgent',
      args: [
        parameters.agent1Token,
        parameters.agent2Token,
        BigInt(String(parameters.stakeAmount)),
      ],
    });
    return `Challenge created. Transaction hash: ${hash}`;
  }

  @Tool({
    description: 'Accept a pending chess battle challenge with a stake amount',
  })
  async acceptChallenge(
    walletClient: EVMWalletClient,
    parameters: AcceptChallengeParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'acceptChallenge',
      args: [parameters.matchId, BigInt(String(parameters.stakeAmount))],
    });
    return `Challenge accepted. Transaction hash: ${hash}`;
  }

  @Tool({
    description: 'Decline or cancel a pending chess battle challenge',
  })
  async declineChallenge(
    walletClient: EVMWalletClient,
    parameters: DeclineChallengeParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'declineChallenge',
      args: [parameters.matchId],
    });
    return `Challenge declined. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Settle a completed chess match with the winner and backend-signed authorization',
  })
  async settleMatch(
    walletClient: EVMWalletClient,
    parameters: SettleMatchParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'settleMatch',
      args: [parameters.matchId, parameters.winner, parameters.signature],
    });
    return `Match settled. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Cancel a match that has expired past the timeout period. Anyone can call this.',
  })
  async cancelExpiredMatch(
    walletClient: EVMWalletClient,
    parameters: CancelExpiredMatchParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'cancelExpiredMatch',
      args: [parameters.matchId],
    });
    return `Expired match cancelled. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Get details of a chess battle match including agents, stakes, status, and timestamps',
  })
  async getMatch(
    walletClient: EVMWalletClient,
    parameters: GetMatchParams,
  ): Promise<string> {
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'getMatch',
      args: [parameters.matchId],
    });
    const replacer = (_key: string, value: unknown): unknown =>
      typeof value === 'bigint' ? value.toString() : value;
    return JSON.stringify(result.value, replacer);
  }

  @Tool({
    description: 'Get all match IDs from the BattleManager contract',
  })
  async getAllMatches(
    walletClient: EVMWalletClient,
    parameters: EmptyParams,
  ): Promise<string> {
    void parameters;
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'getAllMatches',
    });
    const matches = result.value as string[];
    return `All matches (${matches.length}): ${matches.join(', ')}`;
  }

  @Tool({
    description:
      'Get battle statistics for an agent including wins, losses, and total matches',
  })
  async getAgentStats(
    walletClient: EVMWalletClient,
    parameters: GetAgentStatsParams,
  ): Promise<string> {
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: battleManagerAbi as Abi,
      functionName: 'getAgentStats',
      args: [parameters.agentToken],
    });
    const replacer = (_key: string, value: unknown): unknown =>
      typeof value === 'bigint' ? value.toString() : value;
    return JSON.stringify(result.value, replacer);
  }
}
