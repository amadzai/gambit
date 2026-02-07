import { Module } from '@nestjs/common';
import { MatchServiceModule } from '../../service-modules/match/match.module.js';
import { MatchController } from './match.controller.js';

@Module({
  imports: [MatchServiceModule],
  controllers: [MatchController],
})
export class MatchModule {}
