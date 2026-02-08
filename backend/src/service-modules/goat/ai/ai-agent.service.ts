import { Injectable, Logger } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import { getOnChainTools } from '@goat-sdk/adapter-vercel-ai';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { uniswapV4 } from '../plugins/uniswap-v4/uniswap-v4.plugin.js';
import {
  getContractAddresses,
  HOOKLESS_HOOKS,
  UNISWAP_V4,
} from '../constants/contracts.js';
import { gambit } from '../plugins/gambit/gambit.plugin.js';
import { erc20Wallet } from '../plugins/erc20-wallet/erc20-wallet.plugin.js';

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
          matchEngineAddress: addresses.MATCH_ENGINE,
          gambitHookAddress: addresses.GAMBIT_HOOK,
          usdcAddress: addresses.USDC,
          poolSwapTestAddress: UNISWAP_V4.POOL_SWAP_TEST as `0x${string}`,
        }),
        uniswapV4({
          hookAddress: HOOKLESS_HOOKS,
        }),
        erc20Wallet({
          usdcAddress: addresses.USDC,
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

    const defaultSystem = `You are an autonomous AI chess agent with wallet address ${agentAddress} on Base Sepolia (chain ID 84532).

    You can interact with the Gambit platform to:
    - Challenge other agents to chess battles
    - When calling the challenge tool, always provide myAgentToken, opponentToken, and stakeAmount (string, USDC base units).
    - Accept or decline challenges
    - Check your battle stats and market cap
    - Claim swap fee rewards
    - Swap tokens through Uniswap V4 pools

    Token tools (wallet address, contract addresses, and decimal conversion are all automatic):
    - To check your USDC balance, call getMyUsdcBalance (no parameters needed).
    - To check any ERC20 token balance, call getMyTokenBalance with only the tokenAddress.
    - To send USDC, call sendUsdc with to (the recipient wallet address, e.g. "0x...") and amount in human-readable USDC (e.g. "50" for 50 USDC). The parameter MUST be named "to", NOT "recipient". Do NOT convert to base units yourself.
    - To send any other ERC20 token, call transferToken with tokenAddress, to, and amount in human-readable units. Do NOT convert to base units yourself.
    - To buy your own agent token, you MUST first call approveUsdc with the PoolSwapTest contract (${UNISWAP_V4.POOL_SWAP_TEST}) as the spender and the amount in human-readable USDC. Then call buyOwnToken with agentToken (your token address) and usdcAmount (string, USDC in base units with 6 decimals, e.g. "190000000" for 190 USDC).
    - To sell your own agent token for USDC, you MUST first call approveToken with the token address, the PoolSwapTest contract (${UNISWAP_V4.POOL_SWAP_TEST}) as the spender, and the amount in human-readable units. Then call sellOwnToken with agentToken (your token address) and tokenAmount in human-readable units (e.g. "10" for 10 tokens). Decimal conversion is automatic. This reduces your ELO but gives you USDC.

    Make strategic decisions based on the context provided. Be concise in your reasoning.`;

    this.logger.log(`=== Agent ${agentAddress} executing decision ===`);
    this.logger.log(`Prompt: ${context}`);
    this.logger.log(`Model: ${this.defaultModel}`);

    try {
      const result = await generateText({
        model: this.openrouter.chat(this.defaultModel),
        tools,
        stopWhen: stepCountIs(20),
        system: systemPrompt ?? defaultSystem,
        prompt: context,
      });

      // Log detailed step-by-step breakdown
      for (const [i, step] of result.steps.entries()) {
        this.logger.log(`--- Step ${i + 1}/${result.steps.length} ---`);

        if (step.text) {
          this.logger.log(`  Agent reasoning: ${step.text}`);
        }

        if (step.toolCalls?.length) {
          for (const tc of step.toolCalls) {
            const toolCall = tc as Record<string, unknown>;
            this.logger.log(
              `  Tool call: ${tc.toolName}(${JSON.stringify(toolCall.args ?? toolCall.input ?? '')})`,
            );
          }
        }

        if (step.toolResults?.length) {
          for (const tr of step.toolResults) {
            const toolResult = tr as Record<string, unknown>;
            const raw = toolResult.result ?? toolResult.output ?? '';
            const resultStr =
              typeof raw === 'string' ? raw : JSON.stringify(raw);
            this.logger.log(
              `  Tool result [${tr.toolName}]: ${resultStr.length > 500 ? resultStr.slice(0, 500) + '...' : resultStr}`,
            );
          }
        }
      }

      this.logger.log(
        `Agent ${agentAddress} decision completed. Steps: ${result.steps.length}, ` +
          `Tool calls: ${result.steps.reduce((sum, s) => sum + (s.toolCalls?.length ?? 0), 0)}`,
      );

      if (result.text) {
        this.logger.log(`Agent final response: ${result.text}`);
      }

      return result.text || 'Agent completed actions without text response.';
    } catch (error) {
      this.logger.error(`Agent decision failed for ${agentAddress}: ${error}`);
      throw error;
    }
  }
}
