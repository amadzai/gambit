import { Module } from '@nestjs/common';
import { ChessServiceModule } from '../chess-service/chess-service.module.js';
import { AgentChatService } from './providers/agent-chat.service.js';
import { AgentService } from './providers/agent-chess.service.js';
import { AgentCrudService } from './providers/agent-crud.service.js';

@Module({
  imports: [ChessServiceModule],
  providers: [AgentChatService, AgentService, AgentCrudService],
  exports: [AgentChatService, AgentService, AgentCrudService],
})
export class AgentServiceModule {}
