import { Module } from '@nestjs/common';
import { ChessController } from './chess.controller.js';

@Module({
  controllers: [ChessController],
})
export class ChessModule {}
