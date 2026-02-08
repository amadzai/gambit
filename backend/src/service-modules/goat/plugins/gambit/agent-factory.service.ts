import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { agentFactoryAbi } from './abis/agent-factory.abi.js';
import {
  CreateAgentParams,
  GetMarketCapParams,
  GetAgentInfoParams,
  BuyOwnTokenParams,
  EmptyParams,
} from './parameters.js';
import { Abi } from 'viem';

export class AgentFactoryService {
  private contractAddress: `0x${string}`;

  constructor(contractAddress: `0x${string}`) {
    this.contractAddress = contractAddress;
  }

  @Tool({
    description:
      'Create a new AI chess agent with a tradeable ERC20 token and Uniswap V4 pool on Base Sepolia',
  })
  async createAgent(
    walletClient: EVMWalletClient,
    parameters: CreateAgentParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: agentFactoryAbi as Abi,
      functionName: 'createAgent',
      args: [
        parameters.name,
        parameters.symbol,
        BigInt(String(parameters.usdcAmount)),
        parameters.agentWallet,
      ],
    });
    return `Agent created. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Get the market cap of an agent token in USDC from the AgentFactory contract',
  })
  async getMarketCap(
    walletClient: EVMWalletClient,
    parameters: GetMarketCapParams,
  ): Promise<string> {
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: agentFactoryAbi as Abi,
      functionName: 'getMarketCap',
      args: [parameters.agentToken],
    });
    return `Market cap: ${String(result.value)} (USDC base units, 6 decimals)`;
  }

  @Tool({
    description:
      'Get all agent token addresses created through the AgentFactory',
  })
  async getAllAgents(
    walletClient: EVMWalletClient,
    parameters: EmptyParams,
  ): Promise<string> {
    void parameters;
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: agentFactoryAbi as Abi,
      functionName: 'getAllAgents',
    });
    const agents = result.value as string[];
    return `All agents (${agents.length}): ${agents.join(', ')}`;
  }

  @Tool({
    description:
      'Get detailed info about an agent including name, symbol, creator, wallet, and position IDs',
  })
  async getAgentInfo(
    walletClient: EVMWalletClient,
    parameters: GetAgentInfoParams,
  ): Promise<string> {
    const result = await walletClient.read({
      address: this.contractAddress,
      abi: agentFactoryAbi as Abi,
      functionName: 'getAgentInfo',
      args: [parameters.tokenAddress],
    });
    const replacer = (_key: string, value: unknown): unknown =>
      typeof value === 'bigint' ? value.toString() : value;
    return JSON.stringify(result.value, replacer);
  }

  @Tool({
    description:
      'Buy own agent token using USDC war chest to increase market cap and ELO',
  })
  async buyOwnToken(
    walletClient: EVMWalletClient,
    parameters: BuyOwnTokenParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: this.contractAddress,
      abi: agentFactoryAbi as Abi,
      functionName: 'buyOwnToken',
      args: [parameters.agentToken, BigInt(String(parameters.usdcAmount))],
    });
    return `Token purchased. Transaction hash: ${hash}`;
  }
}
