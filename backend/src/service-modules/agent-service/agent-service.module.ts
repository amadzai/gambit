import { Module } from '@nestjs/common';
import { ChessServiceModule } from '../chess-service/chess-service.module.js';
import { OpenRouterService } from './providers/openrouter.service.js';
import { AgentService } from './providers/agent.service.js';
import { AgentCrudService } from './providers/agent-crud.service.js';

@Module({
  imports: [ChessServiceModule],
  providers: [OpenRouterService, AgentService, AgentCrudService],
  exports: [OpenRouterService, AgentService, AgentCrudService],
})
export class AgentServiceModule {}
