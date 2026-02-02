import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, Matches } from 'class-validator';

export class MakeMoveDto {
  @ApiProperty({
    description: 'Source square in algebraic notation',
    example: 'e2',
  })
  @IsString()
  @Matches(/^[a-h][1-8]$/, {
    message: 'from must be a valid square (e.g., e2, d4)',
  })
  from: string;

  @ApiProperty({
    description: 'Target square in algebraic notation',
    example: 'e4',
  })
  @IsString()
  @Matches(/^[a-h][1-8]$/, {
    message: 'to must be a valid square (e.g., e4, d5)',
  })
  to: string;

  @ApiPropertyOptional({
    description: 'Promotion piece (for pawn promotion)',
    enum: ['q', 'r', 'b', 'n'],
    example: 'q',
  })
  @IsOptional()
  @IsIn(['q', 'r', 'b', 'n'], {
    message: 'promotion must be one of: q, r, b, n',
  })
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export class LoadPositionDto {
  @ApiProperty({
    description: 'FEN string representing the board position',
    example: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  })
  @IsString()
  fen: string;
}

export class GetLegalMovesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter legal moves by source square',
    example: 'e2',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-h][1-8]$/, {
    message: 'square must be a valid square (e.g., e2, d4)',
  })
  square?: string;
}
