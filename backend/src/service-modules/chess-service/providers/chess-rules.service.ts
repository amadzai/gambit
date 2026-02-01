import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Color, GameStatus } from '../../../../generated/prisma/client.js';

@Injectable()
export class ChessRulesService {
  constructor(private prisma: PrismaService) {}

  async createGame() {
    const game = new Chess();

    return this.prisma.chessGame.create({
      data: {
        fen: game.fen(),
        turn: Color.WHITE,
        status: GameStatus.ACTIVE,
      },
    });
  }
}
