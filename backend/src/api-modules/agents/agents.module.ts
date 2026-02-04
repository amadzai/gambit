import { Module } from '@nestjs/common';
import { AgentServiceModule } from '../../service-modules/agent-service/agent-service.module.js';
import { AgentsController } from './agents.controller.js';

@Module({
  imports: [AgentServiceModule],
  controllers: [AgentsController],
})
export class AgentsModule {}
