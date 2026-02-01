import { Module } from '@nestjs/common';
import { ChessRulesService } from './providers/chess-rules.service.js';

@Module({
  providers: [ChessRulesService],
})
export class ChessModule {}
