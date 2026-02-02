import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Chess, Move, Square } from 'chess.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  Color,
  GameStatus,
  ChessGame,
} from '../../../../generated/prisma/client.js';
import {
  LegalMove,
  MakeMoveDto,
  MoveResult,
} from '../interfaces/chess-rules.interface.js';
import {
  EngineMoveRequest,
  EngineMoveResponse,
} from '../interfaces/chess-engine.interface.js';
import { ChessEngineService } from './chess-engine.service.js';

@Injectable()
export class ChessRulesService {
  constructor(
    private prisma: PrismaService,
    private chessEngineService: ChessEngineService,
  ) {}

  /**
   * Create a new chess game with starting position
   */
  async createGame(): Promise<ChessGame> {
    const chess = new Chess();

    return this.prisma.chessGame.create({
      data: {
        fen: chess.fen(),
        turn: Color.WHITE,
        status: GameStatus.ACTIVE,
      },
    });
  }

  /**
   * Get a game by ID
   */
  async getGame(gameId: string): Promise<ChessGame> {
    const game = await this.prisma.chessGame.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    return game;
  }

  /**
   * Make a move in a game
   * Validates the move, updates the game state, and returns the result
   */
  async makeMove(gameId: string, moveDto: MakeMoveDto): Promise<MoveResult> {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.ACTIVE) {
      throw new BadRequestException(
        `Game is not active. Status: ${game.status}`,
      );
    }

    const chess = this.loadGameState(game);

    let move: Move;
    try {
      move = chess.move({
        from: moveDto.from as Square,
        to: moveDto.to as Square,
        promotion: moveDto.promotion,
      });
    } catch {
      throw new BadRequestException(
        `Invalid move: ${moveDto.from} to ${moveDto.to}`,
      );
    }

    if (!move) {
      throw new BadRequestException(
        `Invalid move: ${moveDto.from} to ${moveDto.to}`,
      );
    }

    const newStatus = this.determineGameStatus(chess);
    const newTurn = chess.turn() === 'w' ? Color.WHITE : Color.BLACK;

    const updatedGame = await this.prisma.chessGame.update({
      where: { id: gameId },
      data: {
        fen: chess.fen(),
        pgn: chess.pgn(),
        turn: newTurn,
        status: newStatus,
      },
    });

    return {
      success: true,
      game: updatedGame,
      move,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
    };
  }

  /**
   * Get all legal moves for the current position
   * Optionally filter by square (e.g., get legal moves for piece on 'e2')
   */
  async getLegalMoves(gameId: string, square?: string): Promise<LegalMove[]> {
    const game = await this.getGame(gameId);
    const chess = new Chess(game.fen);

    const moves = square
      ? chess.moves({ square: square as Square, verbose: true })
      : chess.moves({ verbose: true });

    return moves.map((move) => ({
      from: move.from,
      to: move.to,
      san: move.san,
      piece: move.piece,
      captured: move.captured,
      promotion: move.promotion,
      flags: move.flags,
    }));
  }

  /**
   * Validate if a move is legal without executing it
   */
  async validateMove(gameId: string, moveDto: MakeMoveDto): Promise<boolean> {
    const game = await this.getGame(gameId);
    const chess = new Chess(game.fen);

    const legalMoves = chess.moves({ verbose: true });
    return legalMoves.some(
      (move) =>
        move.from === moveDto.from &&
        move.to === moveDto.to &&
        (moveDto.promotion ? move.promotion === moveDto.promotion : true),
    );
  }

  /**
   * Get current game status and metadata
   */
  async getGameStatus(gameId: string): Promise<{
    game: ChessGame;
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    isGameOver: boolean;
    legalMoveCount: number;
  }> {
    const game = await this.getGame(gameId);
    const chess = new Chess(game.fen);

    return {
      game,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
      legalMoveCount: chess.moves().length,
    };
  }

  /**
   * Load a specific FEN position into a game (useful for testing)
   * Note: This clears the PGN history since we're loading an arbitrary position
   */
  async loadPosition(gameId: string, fen: string): Promise<ChessGame> {
    await this.getGame(gameId);

    let chess: Chess;
    try {
      chess = new Chess(fen);
    } catch {
      throw new BadRequestException(`Invalid FEN: ${fen}`);
    }

    const turn = chess.turn() === 'w' ? Color.WHITE : Color.BLACK;
    const status = this.determineGameStatus(chess);

    return this.prisma.chessGame.update({
      where: { id: gameId },
      data: {
        fen: chess.fen(),
        pgn: '',
        turn,
        status,
      },
    });
  }

  /**
   * Request candidate moves from the engine for the current position.
   * Resolves position from gameId (DB) or from direct fen/pgn.
   * Agent picks from the returned set based on playstyle, then can call makeMove().
   */
  async requestMove(request: EngineMoveRequest): Promise<EngineMoveResponse> {
    let fen: string;

    if (request.gameId) {
      const game = await this.getGame(request.gameId);
      if (game.status !== GameStatus.ACTIVE) {
        throw new BadRequestException(
          `Game is not active. Status: ${game.status}`,
        );
      }
      const chess = this.loadGameState(game);
      fen = chess.fen();
    } else if (request.fen) {
      const chess = new Chess(request.fen);
      fen = chess.fen();
    } else if (request.pgn && request.pgn.trim() !== '') {
      const chess = new Chess();
      try {
        chess.loadPgn(request.pgn);
      } catch {
        throw new BadRequestException('Invalid PGN');
      }
      fen = chess.fen();
    } else {
      throw new BadRequestException(
        'Provide gameId, fen, or pgn to request moves',
      );
    }

    return this.chessEngineService.getCandidateMoves(fen, {
      multiPv: request.multiPv,
      movetimeMs: request.movetimeMs,
      depth: request.depth,
      elo: request.elo,
      skill: request.skill,
    });
  }

  /**
   * Resign a game
   */
  async resignGame(gameId: string): Promise<ChessGame> {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.ACTIVE) {
      throw new BadRequestException(
        `Game is not active. Status: ${game.status}`,
      );
    }

    return this.prisma.chessGame.update({
      where: { id: gameId },
      data: {
        status: GameStatus.RESIGNED,
      },
    });
  }

  /**
   * Helper method to load game state from PGN (preserves history) or FEN (position only)
   */
  private loadGameState(game: ChessGame): Chess {
    const chess = new Chess();

    // If PGN exists, load it to preserve move history
    if (game.pgn && game.pgn.trim() !== '') {
      chess.loadPgn(game.pgn);
    } else {
      // Fall back to FEN for games without history (e.g., new games or loaded positions)
      chess.load(game.fen);
    }

    return chess;
  }

  /**
   * Helper method to determine game status from chess.js instance
   */
  private determineGameStatus(chess: Chess): GameStatus {
    if (chess.isCheckmate()) {
      return GameStatus.CHECKMATE;
    }
    if (chess.isStalemate()) {
      return GameStatus.STALEMATE;
    }
    if (chess.isDraw()) {
      return GameStatus.DRAW;
    }
    return GameStatus.ACTIVE;
  }
}
