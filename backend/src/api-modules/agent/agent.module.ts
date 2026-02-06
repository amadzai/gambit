import { Module } from '@nestjs/common';
import { AgentServiceModule } from '../../service-modules/agent-service/agent-service.module.js';
import { AgentController } from './agent.controller.js';

@Module({
  imports: [AgentServiceModule],
  controllers: [AgentController],
})
export class AgentModule {}
