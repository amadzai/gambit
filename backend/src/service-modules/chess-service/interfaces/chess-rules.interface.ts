import { Move } from 'chess.js';
import { ChessGame } from '../../../../generated/prisma/client.js';

/**
 * Input for making a move in a game (source square, target square, optional promotion).
 */
export interface MakeMove {
  /** Source square in algebraic notation (e.g. e2). */
  from: string;
  /** Target square in algebraic notation (e.g. e4). */
  to: string;
  /** Promotion piece when moving a pawn to the last rank (q, r, b, n). */
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/**
 * Result of executing a move: updated game and move details.
 */
export interface MoveResult {
  /** Whether the move was applied successfully. */
  success: boolean;
  /** Updated game record from the database. */
  game: ChessGame;
  /** The move that was made (from chess.js). */
  move?: Move;
}
