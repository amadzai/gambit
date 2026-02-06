import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ChessRulesService } from '../../service-modules/chess-service/providers/chess-rules.service.js';
import {
  MakeMoveDto,
  CreateGameDto,
  GetEngineMovesQueryDto,
} from './dto/chess.dto.js';
import {
  ChessGameResponseDto,
  MoveResultResponseDto,
  EngineMovesResponseDto,
} from './dto/chess.response.dto.js';

@ApiTags('Chess')
@Controller('chess')
export class ChessController {
  constructor(private readonly chessRulesService: ChessRulesService) {}

  @Post('games')
  @ApiOperation({ summary: 'Create a new chess game' })
  @ApiBody({ type: CreateGameDto })
  @ApiResponse({
    status: 201,
    description: 'Game created successfully',
    type: ChessGameResponseDto,
  })
  async createGame(@Body() dto: CreateGameDto): Promise<ChessGameResponseDto> {
    return this.chessRulesService.createGame(dto);
  }

  @Get('games/:id')
  @ApiOperation({ summary: 'Get a chess game by ID' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({
    status: 200,
    description: 'Game retrieved successfully',
    type: ChessGameResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getGame(@Param('id') id: string): Promise<ChessGameResponseDto> {
    return this.chessRulesService.getGame(id);
  }

  @Post('games/:id/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make a move in a chess game' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiBody({ type: MakeMoveDto })
  @ApiResponse({
    status: 200,
    description: 'Move executed successfully',
    type: MoveResultResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid move or game not active' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async makeMove(
    @Param('id') id: string,
    @Body() moveDto: MakeMoveDto,
  ): Promise<MoveResultResponseDto> {
    return this.chessRulesService.makeMove(id, moveDto);
  }

  @Get('games/:id/engine-moves')
  @ApiOperation({
    summary: 'Get Stockfish candidate moves for current position',
  })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({
    status: 200,
    description: 'Candidate moves from engine',
    type: EngineMovesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Game is not active' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getEngineMoves(
    @Param('id') id: string,
    @Query() query: GetEngineMovesQueryDto,
  ): Promise<EngineMovesResponseDto> {
    return this.chessRulesService.requestMove({
      gameId: id,
      multiPv: query.multiPv,
      elo: query.elo,
      movetimeMs: query.movetimeMs,
    });
  }
}
