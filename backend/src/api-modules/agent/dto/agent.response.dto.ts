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

  @ApiProperty({ example: 1000 })
  elo: number;

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
