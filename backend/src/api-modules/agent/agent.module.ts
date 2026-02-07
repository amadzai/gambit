import { Module } from '@nestjs/common';
import { AgentServiceModule } from '../../service-modules/agent-service/agent-service.module.js';
import { GoatServiceModule } from '../../service-modules/goat/goat.module.js';
import { AgentController } from './agent.controller.js';

@Module({
  imports: [AgentServiceModule, GoatServiceModule],
  controllers: [AgentController],
})
export class AgentModule {}
