import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { matchEngineAbi } from './abis/match-engine.abi.js';
import {
  ChallengeParams,
  AcceptChallengeParams,
  DeclineChallengeParams,
  SettleMatchParams,
  CancelMatchParams,
  CancelExpiredChallengeParams,
  GetMatchParams,
  EmptyParams,
} from './parameters.js';
import { Abi } from 'viem';

export class MatchEngineService {
  private contractAddress: `0x${string}`;

  constructor(contractAddress: `0x${string}`) {
    this.contractAddress = contractAddress;
  }

  @Tool({
    description:
      'Challenge another AI agent to a chess match with a staked amount of USDC',
  })
  async challenge(
    walletClient: EVMWalletClient,
    parameters: ChallengeParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'challenge',
      args: [
        parameters.myAgentToken,
        parameters.opponentToken,
        BigInt(String(parameters.stakeAmount)),
      ],
    });
    return `Challenge created. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Accept a pending chess match challenge. The matching stake is automatically taken from your USDC balance.',
  })
  async acceptChallenge(
    walletClient: EVMWalletClient,
    parameters: AcceptChallengeParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'acceptChallenge',
      args: [parameters.matchId],
    });
    return `Challenge accepted. Transaction hash: ${hash}`;
  }

  @Tool({
    description: 'Decline or withdraw a pending chess match challenge',
  })
  async declineChallenge(
    walletClient: EVMWalletClient,
    parameters: DeclineChallengeParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'declineChallenge',
      args: [parameters.matchId],
    });
    return `Challenge declined. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Settle a completed chess match with the winner token and backend-signed authorization',
  })
  async settleMatch(
    walletClient: EVMWalletClient,
    parameters: SettleMatchParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'settleMatch',
      args: [
        parameters.matchId,
        parameters.winnerToken,
        parameters.signature,
      ],
    });
    return `Match settled. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Cancel an active match with backend-signed authorization. Returns stakes to both agents.',
  })
  async cancelMatch(
    walletClient: EVMWalletClient,
    parameters: CancelMatchParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'cancelMatch',
      args: [parameters.matchId, parameters.signature],
    });
    return `Match cancelled. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Cancel a match that has expired past the 24-hour timeout period. Anyone can call this.',
  })
  async cancelExpiredChallenge(
    walletClient: EVMWalletClient,
    parameters: CancelExpiredChallengeParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'cancelExpiredChallenge',
      args: [parameters.matchId],
    });
    return `Expired challenge cancelled. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Get details of a chess match including agents, wallets, stakes, status, and timestamps',
  })
  async getMatch(
    walletClient: EVMWalletClient,
    parameters: GetMatchParams,
  ): Promise<string> {
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'getMatch',
      args: [parameters.matchId],
    });
    const replacer = (_key: string, value: unknown): unknown =>
      typeof value === 'bigint' ? value.toString() : value;
    return JSON.stringify(result.value, replacer);
  }

  @Tool({
    description: 'Get all match IDs from the MatchEngine contract',
  })
  async getAllMatches(
    walletClient: EVMWalletClient,
    parameters: EmptyParams,
  ): Promise<string> {
    void parameters;
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: matchEngineAbi as unknown as Abi,
      functionName: 'getAllMatches',
    });
    const matches = result.value as string[];
    return `All matches (${matches.length}): ${matches.join(', ')}`;
  }
}
