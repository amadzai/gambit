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
  LoadPositionDto,
  GetLegalMovesQueryDto,
  GetEngineMovesQueryDto,
} from './dto/chess.dto.js';
import {
  ChessGameResponseDto,
  MoveResultResponseDto,
  LegalMoveResponseDto,
  GameStatusResponseDto,
  ValidateMoveResponseDto,
  EngineMovesResponseDto,
} from './dto/chess.response.dto.js';

@ApiTags('Chess')
@Controller('chess')
export class ChessController {
  constructor(private readonly chessRulesService: ChessRulesService) {}

  @Post('games')
  @ApiOperation({ summary: 'Create a new chess game' })
  @ApiResponse({
    status: 201,
    description: 'Game created successfully',
    type: ChessGameResponseDto,
  })
  async createGame(): Promise<ChessGameResponseDto> {
    return this.chessRulesService.createGame();
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

  @Get('games/:id/legal-moves')
  @ApiOperation({ summary: 'Get all legal moves for current position' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({
    status: 200,
    description: 'Legal moves retrieved successfully',
    type: [LegalMoveResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getLegalMoves(
    @Param('id') id: string,
    @Query() query: GetLegalMovesQueryDto,
  ): Promise<LegalMoveResponseDto[]> {
    return this.chessRulesService.getLegalMoves(id, query.square);
  }

  @Post('games/:id/validate-move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate if a move is legal without executing it' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiBody({ type: MakeMoveDto })
  @ApiResponse({
    status: 200,
    description: 'Move validation result',
    type: ValidateMoveResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async validateMove(
    @Param('id') id: string,
    @Body() moveDto: MakeMoveDto,
  ): Promise<ValidateMoveResponseDto> {
    const valid = await this.chessRulesService.validateMove(id, moveDto);
    return { valid };
  }

  @Get('games/:id/status')
  @ApiOperation({ summary: 'Get current game status and metadata' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({
    status: 200,
    description: 'Game status retrieved successfully',
    type: GameStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getGameStatus(@Param('id') id: string): Promise<GameStatusResponseDto> {
    return this.chessRulesService.getGameStatus(id);
  }

  @Post('games/:id/load-position')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Load a specific FEN position into a game' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiBody({ type: LoadPositionDto })
  @ApiResponse({
    status: 200,
    description: 'Position loaded successfully',
    type: ChessGameResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid FEN string' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async loadPosition(
    @Param('id') id: string,
    @Body() dto: LoadPositionDto,
  ): Promise<ChessGameResponseDto> {
    return this.chessRulesService.loadPosition(id, dto.fen);
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
      skill: query.skill,
      movetimeMs: query.movetimeMs,
      depth: query.depth,
    });
  }

  @Post('games/:id/resign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resign a game' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({
    status: 200,
    description: 'Game resigned successfully',
    type: ChessGameResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Game is not active' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async resignGame(@Param('id') id: string): Promise<ChessGameResponseDto> {
    return this.chessRulesService.resignGame(id);
  }
}
