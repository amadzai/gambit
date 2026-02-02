import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Color, GameStatus } from '../../../../generated/prisma/client.js';

export class ChessGameResponseDto {
  @ApiProperty({
    description: 'Unique game identifier',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'FEN string representing current board position',
    example: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  })
  fen: string;

  @ApiProperty({
    description: 'PGN notation of the game history',
    example: '1. e4 e5 2. Nf3 Nc6',
  })
  pgn: string;

  @ApiProperty({
    description: 'Current turn',
    enum: Color,
    example: 'WHITE',
  })
  turn: Color;

  @ApiProperty({
    description: 'Current game status',
    enum: GameStatus,
    example: 'ACTIVE',
  })
  status: GameStatus;

  @ApiProperty({
    description: 'Game creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

export class MoveDto {
  @ApiProperty({ example: 'e2' })
  from: string;

  @ApiProperty({ example: 'e4' })
  to: string;

  @ApiProperty({ example: 'e4' })
  san: string;

  @ApiProperty({ example: 'p' })
  piece: string;

  @ApiProperty({ example: 'P' })
  color: string;

  @ApiPropertyOptional({ example: 'p' })
  captured?: string;

  @ApiPropertyOptional({ example: 'q' })
  promotion?: string;

  @ApiProperty({ example: 'b' })
  flags: string;
}

export class MoveResultResponseDto {
  @ApiProperty({
    description: 'Whether the move was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Updated game state',
    type: ChessGameResponseDto,
  })
  game: ChessGameResponseDto;

  @ApiPropertyOptional({
    description: 'Details of the move made',
    type: MoveDto,
  })
  move?: MoveDto;

  @ApiProperty({
    description: 'Whether the opponent is in check',
    example: false,
  })
  isCheck: boolean;

  @ApiProperty({
    description: 'Whether the game ended in checkmate',
    example: false,
  })
  isCheckmate: boolean;

  @ApiProperty({
    description: 'Whether the game ended in stalemate',
    example: false,
  })
  isStalemate: boolean;

  @ApiProperty({
    description: 'Whether the game ended in a draw',
    example: false,
  })
  isDraw: boolean;

  @ApiProperty({
    description: 'Whether the game is over',
    example: false,
  })
  isGameOver: boolean;
}

export class LegalMoveResponseDto {
  @ApiProperty({
    description: 'Source square',
    example: 'e2',
  })
  from: string;

  @ApiProperty({
    description: 'Target square',
    example: 'e4',
  })
  to: string;

  @ApiProperty({
    description: 'Move in Standard Algebraic Notation',
    example: 'e4',
  })
  san: string;

  @ApiProperty({
    description: 'Piece type (p, n, b, r, q, k)',
    example: 'p',
  })
  piece: string;

  @ApiPropertyOptional({
    description: 'Captured piece type',
    example: 'p',
  })
  captured?: string;

  @ApiPropertyOptional({
    description: 'Promotion piece type',
    example: 'q',
  })
  promotion?: string;

  @ApiProperty({
    description:
      'Move flags (n=normal, b=pawn push, e=en passant, c=capture, p=promotion, k=kingside castle, q=queenside castle)',
    example: 'b',
  })
  flags: string;
}

export class GameStatusResponseDto {
  @ApiProperty({
    description: 'Game data',
    type: ChessGameResponseDto,
  })
  game: ChessGameResponseDto;

  @ApiProperty({
    description: 'Whether the current player is in check',
    example: false,
  })
  isCheck: boolean;

  @ApiProperty({
    description: 'Whether the game ended in checkmate',
    example: false,
  })
  isCheckmate: boolean;

  @ApiProperty({
    description: 'Whether the game ended in stalemate',
    example: false,
  })
  isStalemate: boolean;

  @ApiProperty({
    description: 'Whether the game ended in a draw',
    example: false,
  })
  isDraw: boolean;

  @ApiProperty({
    description: 'Whether the game is over',
    example: false,
  })
  isGameOver: boolean;

  @ApiProperty({
    description: 'Number of legal moves available',
    example: 20,
  })
  legalMoveCount: number;
}

export class ValidateMoveResponseDto {
  @ApiProperty({
    description: 'Whether the move is valid',
    example: true,
  })
  valid: boolean;
}
