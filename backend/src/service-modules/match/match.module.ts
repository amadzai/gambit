import { Module } from '@nestjs/common';
import { AgentServiceModule } from '../agent-service/agent-service.module.js';
import { ChessServiceModule } from '../chess-service/chess-service.module.js';
import { MatchService } from './providers/match.service.js';

@Module({
  imports: [AgentServiceModule, ChessServiceModule],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchServiceModule {}
