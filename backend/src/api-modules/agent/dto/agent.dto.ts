import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Playstyle } from '../../../../generated/prisma/client.js';

export class CreateAgentDto {
  @ApiProperty({ description: 'Agent display name', example: 'GambitBot' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Agent playstyle',
    enum: Playstyle,
    example: Playstyle.AGGRESSIVE,
  })
  @IsEnum(Playstyle)
  playstyle: Playstyle;

  @ApiPropertyOptional({
    description:
      'Preferred opening hint (free-form string). If it looks like UCI (e2e4), the agent will try to match it early.',
    example: 'e2e4',
  })
  @IsOptional()
  @IsString()
  opening?: string;

  @ApiPropertyOptional({
    description: 'Personality hint (free-form)',
    example: 'Bold and tactical, likes initiative.',
  })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiPropertyOptional({
    description:
      'Profile image URL (will be Supabase later; optional for hackathon)',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Agent ELO used to set Stockfish strength (600–3000)',
    example: 1200,
    default: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(600)
  @Max(3000)
  elo?: number;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({
    description: 'Agent display name',
    example: 'GambitBot',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Agent playstyle',
    enum: Playstyle,
    example: Playstyle.AGGRESSIVE,
  })
  @IsOptional()
  @IsEnum(Playstyle)
  playstyle?: Playstyle;

  @ApiPropertyOptional({
    description:
      'Preferred opening hint (free-form string). If it looks like UCI (e2e4), the agent will try to match it early.',
    example: 'e2e4',
  })
  @IsOptional()
  @IsString()
  opening?: string;

  @ApiPropertyOptional({
    description: 'Personality hint (free-form)',
    example: 'Bold and tactical, likes initiative.',
  })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiPropertyOptional({
    description:
      'Profile image URL (will be Supabase later; optional for hackathon)',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Agent ELO used to set Stockfish strength (600–3000)',
    example: 1200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(600)
  @Max(3000)
  elo?: number;
}

export class AgentMoveDto {
  @ApiProperty({ description: 'Chess game ID', example: 'clx1234567890' })
  @IsString()
  gameId: string;

  @ApiPropertyOptional({
    description: 'Number of Stockfish candidate moves (MultiPV)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  multiPv?: number;

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
