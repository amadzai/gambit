import { Injectable, Logger } from '@nestjs/common';
import type { Hex } from 'viem';
import { WalletManagerService } from './wallet/wallet-manager.service.js';
import { AIAgentService } from './ai/ai-agent.service.js';

@Injectable()
export class GoatService {
  private readonly logger = new Logger(GoatService.name);

  constructor(
    private readonly walletManager: WalletManagerService,
    private readonly aiAgent: AIAgentService,
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
      throw new Error(
        `Wallet not initialized for agent ${agentId}. Call initializeAgentWallet first.`,
      );
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
