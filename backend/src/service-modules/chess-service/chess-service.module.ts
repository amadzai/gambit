import { Module } from '@nestjs/common';
import { ChessEngineService } from './providers/chess-engine.service.js';
import { ChessRulesService } from './providers/chess-rules.service.js';

@Module({
  providers: [ChessEngineService, ChessRulesService],
  exports: [ChessEngineService, ChessRulesService],
})
export class ChessServiceModule {}
