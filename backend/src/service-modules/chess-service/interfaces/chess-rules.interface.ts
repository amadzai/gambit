import { Move } from 'chess.js';
import { ChessGame } from '../../../../generated/prisma/client.js';

export interface MakeMoveDto {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface MoveResult {
  success: boolean;
  game: ChessGame;
  move?: Move;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
}

export interface LegalMove {
  from: string;
  to: string;
  san: string;
  piece: string;
  captured?: string;
  promotion?: string;
  flags: string;
}
