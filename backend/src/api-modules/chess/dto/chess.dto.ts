import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class GetEngineMovesQueryDto {
  @ApiPropertyOptional({
    description: 'Number of candidate moves (MultiPV)',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  multiPv?: number;

  @ApiPropertyOptional({
    description: 'Agent ELO for engine strength (600–3000)',
    example: 1500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(600)
  @Max(3000)
  elo?: number;

  @ApiPropertyOptional({
    description: 'Stockfish skill level 0–20 (overrides elo if both provided)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  skill?: number;

  @ApiPropertyOptional({
    description: 'Analysis time in milliseconds',
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(60000)
  movetimeMs?: number;

  @ApiPropertyOptional({
    description: 'Analysis depth (alternative to movetimeMs)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  depth?: number;
}
