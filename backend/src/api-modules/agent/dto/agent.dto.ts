import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
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
    description: 'Wallet address of the agent creator',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsOptional()
  @IsString()
  creator?: string;

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

  @ApiPropertyOptional({
    description:
      'ERC20 token address associated with this agent (if already deployed)',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsOptional()
  @IsString()
  tokenAddress?: string;
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
    description: 'Wallet address of the agent creator',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsOptional()
  @IsString()
  creator?: string;

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

  @ApiPropertyOptional({
    description: 'ERC20 token address associated with this agent',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsOptional()
  @IsString()
  tokenAddress?: string;
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

export class ExecuteAgentActionDto {
  @ApiProperty({
    description: 'Natural language context/instructions for the agent action',
    example: 'Claim trading fees for the agent wallet and report the result.',
  })
  @IsString()
  context: string;

  @ApiPropertyOptional({
    description:
      'Optional system prompt to guide the agent behavior (advanced usage)',
    example: 'You are a careful on-chain operator. Be concise.',
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}

export class RegisterTokenDto {
  @ApiProperty({
    description:
      'Transaction hash from the AgentFactory.createAgent() call on-chain',
    example:
      '0xabc123def456789012345678901234567890123456789012345678901234abcd',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'txHash must be a valid 0x-prefixed 32-byte hex string',
  })
  txHash: string;
}
