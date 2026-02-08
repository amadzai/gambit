import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ChallengeDto {
  @ApiProperty({
    description: 'Agent ID initiating the challenge',
    example: 'clx1234567890',
  })
  @IsString()
  challengerAgentId: string;

  @ApiProperty({
    description: 'Agent ID being challenged',
    example: 'clx0987654321',
  })
  @IsString()
  opponentAgentId: string;

  @ApiProperty({
    description: 'Stake amount in human-readable USDC (e.g. "1" for 1 USDC)',
    example: '1',
  })
  @IsString()
  stakeAmount: string;

  @ApiPropertyOptional({
    description: 'Number of Stockfish candidate moves (MultiPV)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  multiPv?: number;

  @ApiPropertyOptional({
    description: 'Stockfish analysis time in milliseconds',
    example: 200,
    default: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  movetimeMs?: number;

  @ApiPropertyOptional({
    description:
      'Delay between moves in milliseconds (for frontend animation pacing)',
    example: 2000,
    default: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  delayMs?: number;
}

export class AcceptChallengeDto {
  @ApiProperty({
    description:
      'On-chain match ID (bytes32) from the ChallengeCreated event',
    example: '0xabc123...',
  })
  @IsString()
  onChainMatchId: string;

  @ApiProperty({
    description: 'Agent ID that created the challenge (will play as white)',
    example: 'clx1234567890',
  })
  @IsString()
  challengerAgentId: string;

  @ApiProperty({
    description: 'Agent ID accepting the challenge (will play as black)',
    example: 'clx0987654321',
  })
  @IsString()
  opponentAgentId: string;

  @ApiPropertyOptional({
    description: 'Number of Stockfish candidate moves (MultiPV)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  multiPv?: number;

  @ApiPropertyOptional({
    description: 'Stockfish analysis time in milliseconds',
    example: 200,
    default: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  movetimeMs?: number;

  @ApiPropertyOptional({
    description:
      'Delay between moves in milliseconds (for frontend animation pacing)',
    example: 2000,
    default: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  delayMs?: number;
}

export class StartMatchDto {
  @ApiProperty({
    description: 'White-side agent ID',
    example: 'clx1234567890',
  })
  @IsString()
  whiteAgentId: string;

  @ApiProperty({
    description: 'Black-side agent ID',
    example: 'clx0987654321',
  })
  @IsString()
  blackAgentId: string;

  @ApiPropertyOptional({
    description: 'Number of Stockfish candidate moves (MultiPV)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  multiPv?: number;

  @ApiPropertyOptional({
    description: 'Stockfish analysis time in milliseconds',
    example: 200,
    default: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  movetimeMs?: number;

  @ApiPropertyOptional({
    description:
      'Delay between moves in milliseconds (for frontend animation pacing)',
    example: 2000,
    default: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  delayMs?: number;
}
