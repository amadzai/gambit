import { Injectable, Logger } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import { getOnChainTools } from '@goat-sdk/adapter-vercel-ai';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { erc20, USDC } from '@goat-sdk/plugin-erc20';
import { uniswapV4 } from '../plugins/uniswap-v4/uniswap-v4.plugin.js';
import { getContractAddresses } from '../constants/contracts.js';
import { gambit } from '../plugins/gambit/gambit.plugin.js';

@Injectable()
export class AIAgentService {
  private readonly logger = new Logger(AIAgentService.name);

  private readonly openrouter = createOpenAI({
    apiKey: process.env.OPEN_ROUTER_API_KEY ?? '',
    baseURL: 'https://openrouter.ai/api/v1',
  });

  private readonly defaultModel =
    process.env.OPEN_ROUTER_MODEL ?? 'openai/gpt-4o-mini';

  async getToolsForWallet(wallet: EVMWalletClient) {
    const addresses = getContractAddresses();

    return getOnChainTools({
      wallet,
      plugins: [
        gambit({
          agentFactoryAddress: addresses.AGENT_FACTORY,
          battleManagerAddress: addresses.BATTLE_MANAGER,
          gambitHookAddress: addresses.GAMBIT_HOOK,
        }),
        uniswapV4({
          hookAddress: addresses.GAMBIT_HOOK,
        }),
        erc20({
          tokens: [
            {
              ...USDC,
              chains: {
                84532: {
                  contractAddress: addresses.USDC,
                },
              },
            },
          ],
        }),
      ],
    });
  }

  async executeAgentDecision(
    wallet: EVMWalletClient,
    context: string,
    systemPrompt?: string,
  ): Promise<string> {
    const tools = await this.getToolsForWallet(wallet);
    const agentAddress = wallet.getAddress();

    const defaultSystem = `You are an autonomous AI chess agent with wallet address ${agentAddress} on Base Sepolia.
You can interact with the GambAIt platform to:
- Challenge other agents to chess battles
- Accept or decline challenges
- Check your battle stats and market cap
- Claim swap fee rewards
- Swap tokens through Uniswap V4 pools

Make strategic decisions based on the context provided. Be concise in your reasoning.`;

    try {
      const result = await generateText({
        model: this.openrouter(this.defaultModel),
        tools,
        stopWhen: stepCountIs(5),
        system: systemPrompt ?? defaultSystem,
        prompt: context,
      });

      this.logger.log(
        `Agent ${agentAddress} decision completed. Steps: ${result.steps.length}, ` +
          `Tool calls: ${result.steps.reduce((sum, s) => sum + (s.toolCalls?.length ?? 0), 0)}`,
      );

      return result.text || 'Agent completed actions without text response.';
    } catch (error) {
      this.logger.error(`Agent decision failed for ${agentAddress}: ${error}`);
      throw error;
    }
  }
}
