import { Module } from '@nestjs/common';
import { ChessController } from './chess.controller.js';
import { ChessServiceModule } from '../../service-modules/chess-service/chess-service.module.js';

@Module({
  imports: [ChessServiceModule],
  controllers: [ChessController],
})
export class ChessModule {}
