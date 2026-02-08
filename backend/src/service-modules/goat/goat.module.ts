import { Module } from '@nestjs/common';
import { GoatService } from './goat.service.js';
import { WalletManagerService } from './wallet/wallet-manager.service.js';
import { SettlementSignerService } from './wallet/settlement-signer.service.js';
import { AIAgentService } from './ai/ai-agent.service.js';
import { MatchEventListenerService } from './events/match-event-listener.service.js';

@Module({
  providers: [
    GoatService,
    WalletManagerService,
    SettlementSignerService,
    AIAgentService,
    MatchEventListenerService,
  ],
  exports: [GoatService, WalletManagerService, SettlementSignerService],
})
export class GoatServiceModule {}
