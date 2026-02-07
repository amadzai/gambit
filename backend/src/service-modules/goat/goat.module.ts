import { Module } from '@nestjs/common';
import { GoatService } from './goat.service.js';
import { WalletManagerService } from './wallet/wallet-manager.service.js';
import { AIAgentService } from './ai/ai-agent.service.js';

@Module({
  providers: [GoatService, WalletManagerService, AIAgentService],
  exports: [GoatService, WalletManagerService],
})
export class GoatServiceModule {}
