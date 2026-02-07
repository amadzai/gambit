import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsEnum,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GameStatus } from '../../../../generated/prisma/client.js';

export class CreateGameDto {
  @ApiProperty({
    description: 'Agent id that will play as White',
    example: 'clx1234567890',
  })
  @IsString()
  whiteAgentId: string;

  @ApiProperty({
    description: 'Agent id that will play as Black',
    example: 'clx1234567890',
  })
  @IsString()
  blackAgentId: string;
}

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

export class ListGamesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by game status',
    enum: GameStatus,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @ApiPropertyOptional({
    description: 'Filter by agent ID (matches either white or black side)',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of games to return',
    example: 20,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @ApiPropertyOptional({
    description: 'Number of games to skip (for pagination)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}

export class GetEngineMovesQueryDto {
  @ApiPropertyOptional({
    description: 'Number of candidate moves (MultiPV)',
    example: 10,
    default: 10,
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
    description: 'Analysis time in milliseconds',
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(60000)
  movetimeMs?: number;
}
