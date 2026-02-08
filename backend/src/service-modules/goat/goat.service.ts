import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import type { Hex } from 'viem';
import { WalletManagerService } from './wallet/wallet-manager.service.js';
import { AIAgentService } from './ai/ai-agent.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgentCrudService } from '../agent-service/providers/agent-crud.service.js';
import { getContractAddresses, UNISWAP_V4 } from './constants/contracts.js';

@Injectable()
export class GoatService {
  private readonly logger = new Logger(GoatService.name);

  constructor(
    private readonly walletManager: WalletManagerService,
    private readonly aiAgent: AIAgentService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AgentCrudService))
    private readonly agentCrudService: AgentCrudService,
  ) {}

  initializeAgentWallet(agentId: string, privateKey: Hex) {
    return this.walletManager.getOrCreateWallet(agentId, privateKey);
  }

  async executeAgentAction(
    agentId: string,
    context: string,
    systemPrompt?: string,
  ): Promise<string> {
    const wallet = this.walletManager.getWallet(agentId);
    if (!wallet) {
      const agent = await this.prisma.agent.findUnique({
        where: {
          id: agentId,
        },
        select: {
          encryptedPrivateKey: true,
        },
      });

      if (agent && agent.encryptedPrivateKey) {
        const decryptedPrivateKey = this.walletManager.decryptPrivateKey(
          agent.encryptedPrivateKey,
        );

        this.initializeAgentWallet(agentId, decryptedPrivateKey as Hex);
      } else {
        const { address: walletAddress, privateKey } =
          this.walletManager.generateNewKeyPair();
        const encryptedPrivateKey =
          this.walletManager.encryptPrivateKey(privateKey);

        await this.prisma.agent.update({
          where: {
            id: agentId,
          },
          data: {
            walletAddress,
            encryptedPrivateKey,
          },
        });

        this.initializeAgentWallet(agentId, privateKey);
      }

      const wallet = this.walletManager.getWallet(agentId);

      return this.aiAgent.executeAgentDecision(wallet!, context, systemPrompt);
    }

    return this.aiAgent.executeAgentDecision(wallet, context, systemPrompt);
  }

  async manageReserves(agentId: string, hint?: string): Promise<string> {
    const agent = await this.agentCrudService.get({ id: agentId });

    if (!agent.tokenAddress) {
      throw new NotFoundException(
        'Agent does not have a registered token address (required for buyback option)',
      );
    }

    const winRate =
      agent.totalGames && agent.totalGames > 0
        ? ((agent.wins ?? 0) / agent.totalGames * 100).toFixed(1)
        : '0.0';

    const creatorLine = agent.creator
      ? `Your creator's address is ${agent.creator}.`
      : 'You have no registered creator address (skip the REWARD CREATOR option).';

    const systemPrompt = [
      `You are ${agent.name}, an autonomous AI chess agent managing your USDC war chest.`,
      `Your wallet address is ${agent.walletAddress ?? 'unknown'} on Base Sepolia (chain ID 84532).`,
      `Your token address is ${agent.tokenAddress}.`,
      creatorLine,
      `Your current ELO is ${agent.elo}. Your record: ${agent.wins ?? 0}W-${agent.losses ?? 0}L-${agent.draws ?? 0}D (win rate: ${winRate}%).`,
      `Your playstyle is ${agent.playstyle}. Personality: ${agent.personality ?? 'not set'}.`,
      '',
      'Your reserves are used for staking to compete in chess matches to win more USDC.',
    ].join('\n');

    const rewardOption = agent.creator
      ? `3. REWARD CREATOR — Send a USDC tip to your creator as thanks for configuring you well. Call sendUsdc with to="${agent.creator}" and amount in human-readable USDC (e.g. "10" for 10 USDC). Only do this if you feel your creator made you strong (good win rate, good personality).`
      : '';

    const context = [
      'You must first check your USDC balance using getMyUsdcBalance.',
      `Also check your own token balance by calling getMyTokenBalance with tokenAddress="${agent.tokenAddress}".`,
      '',
      'Then choose ONE of these actions and EXECUTE IT by calling the corresponding tool. Do not ask for confirmation or list options — decide and act.',
      '',
      '1. SAVE — Keep your USDC reserves. If you choose this, do NOT call any further tools; just state in one line that you are saving. Choose this if your balance is too low to risk.',
      '',
      `2. BUYBACK — This requires TWO sequential steps (do NOT call them in parallel):`,
      `   Step A: Call approveUsdc with spender="${UNISWAP_V4.POOL_SWAP_TEST}" and amount in human-readable USDC (e.g. "190" for 190 USDC). WAIT for this to complete before proceeding.`,
      `   Step B: AFTER approval succeeds, call buyOwnToken with agentToken="${agent.tokenAddress}" and usdcAmount in base units (6 decimals, e.g. "190000000" for 190 USDC).`,
      `   You decide the amount based on your balance; leave a reserve for stakes.`,
      '',
      rewardOption,
      '',
      `4. SELL OWN TOKEN — This requires TWO sequential steps (do NOT call them in parallel):`,
      `   Step A: Call approveToken with tokenAddress="${agent.tokenAddress}", spender="${UNISWAP_V4.POOL_SWAP_TEST}", and amount in human-readable units (e.g. "10" for 10 tokens). WAIT for this to complete before proceeding.`,
      `   Step B: AFTER approval succeeds, call sellOwnToken with agentToken="${agent.tokenAddress}" and tokenAmount in human-readable units (e.g. "10" for 10 tokens). Decimal conversion is automatic.`,
      `   This will REDUCE your ELO/power but give you USDC to challenge other agents and potentially win more.`,
      `   Only do this if you need USDC for challenges but don't have enough reserves.`,
      '',
      'Rules: Reason in one short paragraph, then immediately call the tool for your choice (buyOwnToken, sendUsdc, or sellOwnToken). For SAVE, call no tool. Never output "A) B) C)" or "which direction?" — execute your chosen action in this turn.',
      hint ? `\nAdditional hint from caller: ${hint}` : '',
    ].join('\n');

    this.logger.log(
      `Managing reserves for agent ${agentId} (${agent.name}), ELO=${agent.elo}, token=${agent.tokenAddress}`,
    );

    return this.executeAgentAction(agentId, context, systemPrompt);
  }

  getWallet(agentId: string) {
    return this.walletManager.getWallet(agentId);
  }

  encryptPrivateKey(privateKey: string): string {
    return this.walletManager.encryptPrivateKey(privateKey);
  }

  decryptPrivateKey(encryptedKey: string): string {
    return this.walletManager.decryptPrivateKey(encryptedKey);
  }
}
