import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Playstyle } from '../../../../generated/prisma/client.js';
import {
  EngineMovesResponseDto,
  MoveResultResponseDto,
} from '../../chess/dto/chess.response.dto.js';

export class AgentResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'GambitBot' })
  name: string;

  @ApiProperty({ enum: Playstyle, example: Playstyle.AGGRESSIVE })
  playstyle: Playstyle;

  @ApiPropertyOptional({
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  creator?: string | null;

  @ApiPropertyOptional({ example: 'e2e4' })
  opening?: string | null;

  @ApiPropertyOptional({ example: 'Bold and tactical.' })
  personality?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  profileImage?: string | null;

  @ApiPropertyOptional({
    description: 'Agent wallet address (EOA for on-chain actions)',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  walletAddress?: string | null;

  @ApiPropertyOptional({
    description: 'ERC20 token address associated with this agent',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  tokenAddress?: string | null;

  @ApiProperty({ example: 1000 })
  elo: number;

  @ApiPropertyOptional({ description: 'Number of games won', example: 5 })
  wins?: number;

  @ApiPropertyOptional({ description: 'Number of games lost', example: 3 })
  losses?: number;

  @ApiPropertyOptional({ description: 'Number of games drawn', example: 1 })
  draws?: number;

  @ApiPropertyOptional({
    description: 'Total completed games',
    example: 9,
  })
  totalGames?: number;

  @ApiPropertyOptional({
    description: 'Win rate as a percentage (0–100)',
    example: 55.56,
  })
  winRate?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AppliedMoveDto {
  @ApiProperty({ example: 'e2' })
  from: string;

  @ApiProperty({ example: 'e4' })
  to: string;

  @ApiPropertyOptional({ example: 'q' })
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export class AgentMoveResponseDto {
  @ApiProperty({ type: AgentResponseDto })
  agent: AgentResponseDto;

  @ApiProperty({
    description: 'Engine analysis used for the decision',
    type: EngineMovesResponseDto,
  })
  engine: EngineMovesResponseDto;

  @ApiProperty({ description: 'Selected UCI move', example: 'e2e4' })
  selectedUci: string;

  @ApiProperty({ type: AppliedMoveDto })
  appliedMove: AppliedMoveDto;

  @ApiProperty({ type: MoveResultResponseDto })
  moveResult: MoveResultResponseDto;

  @ApiProperty({
    description: 'Whether the service had to fall back to top Stockfish move',
    example: false,
  })
  fallbackUsed: boolean;
}

export class ExecuteAgentActionResponseDto {
  @ApiProperty({
    description: 'Tool/agent output text from the GOAT action execution',
    example: 'Claimed rewards. Transaction hash: 0xabc123...',
  })
  result: string;
}
