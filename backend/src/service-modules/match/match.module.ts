import { Module, forwardRef } from '@nestjs/common';
import { AgentServiceModule } from '../agent-service/agent-service.module.js';
import { ChessServiceModule } from '../chess-service/chess-service.module.js';
import { GoatServiceModule } from '../goat/goat.module.js';
import { MatchService } from './providers/match.service.js';

@Module({
  imports: [
    forwardRef(() => AgentServiceModule),
    ChessServiceModule,
    forwardRef(() => GoatServiceModule),
  ],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchServiceModule {}
