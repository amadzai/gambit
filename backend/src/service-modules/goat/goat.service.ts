import { Injectable, Logger } from '@nestjs/common';
import type { Hex } from 'viem';
import { WalletManagerService } from './wallet/wallet-manager.service.js';
import { AIAgentService } from './ai/ai-agent.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GoatService {
  private readonly logger = new Logger(GoatService.name);

  constructor(
    private readonly walletManager: WalletManagerService,
    private readonly aiAgent: AIAgentService,
    private readonly prisma: PrismaService,
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
