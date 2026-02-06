import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Chess, Move, Square } from 'chess.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  Color,
  GameStatus,
  ChessGame,
  Winner,
} from '../../../../generated/prisma/client.js';
import { MakeMove, MoveResult } from '../interfaces/chess-rules.interface.js';
import {
  EngineMoveRequest,
  EngineMoveResponse,
} from '../interfaces/chess-engine.interface.js';
import { ChessEngineService } from './chess-engine.service.js';

@Injectable()
export class ChessRulesService {
  private readonly logger = new Logger(ChessRulesService.name);

  constructor(
    private prisma: PrismaService,
    private chessEngineService: ChessEngineService,
  ) {}

  /**
   * Create a new chess game with starting position and assigned agents.
   */
  async createGame(input: {
    whiteAgentId: string;
    blackAgentId: string;
  }): Promise<ChessGame> {
    this.logger.log(
      `Creating Chess Game with White: ${input.whiteAgentId} and Black: ${input.blackAgentId}`,
    );

    const chess = new Chess();

    try {
      const game = await this.prisma.chessGame.create({
        data: {
          fen: chess.fen(),
          turn: Color.WHITE,
          status: GameStatus.ACTIVE,
          whiteAgentId: input.whiteAgentId,
          blackAgentId: input.blackAgentId,
        },
      });

      this.logger.log(`Game created: ${game.id}`);

      return game;
    } catch (error) {
      this.logger.error(
        `Failed to Create Chess Game for White: ${input.whiteAgentId} and Black: ${input.blackAgentId}`,
        error,
      );

      throw error;
    }
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
  async makeMove(gameId: string, makeMove: MakeMove): Promise<MoveResult> {
    this.logger.log(
      `makeMove gameId=${gameId} ${makeMove.from}→${makeMove.to}`,
    );
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
        from: makeMove.from as Square,
        to: makeMove.to as Square,
        promotion: makeMove.promotion,
      });
    } catch {
      throw new BadRequestException(
        `Invalid move: ${makeMove.from} to ${makeMove.to}`,
      );
    }

    if (!move) {
      throw new BadRequestException(
        `Invalid move: ${makeMove.from} to ${makeMove.to}`,
      );
    }

    const newStatus = this.determineGameStatus(chess);
    const newTurn = chess.turn() === 'w' ? Color.WHITE : Color.BLACK;
    const winner = this.determineWinner(newStatus, newTurn);
    const pgn = this.stripPgnHeaders(chess.pgn());

    const updatedGame = await this.prisma.chessGame.update({
      where: { id: gameId },
      data: {
        fen: chess.fen(),
        pgn,
        turn: newTurn,
        status: newStatus,
        winner,
      },
    });

    this.logger.log(
      `Move applied: ${move.san} (check=${chess.isCheck()}, gameOver=${chess.isGameOver()})`,
    );
    return {
      success: true,
      game: updatedGame,
      move,
    };
  }

  /**
   * Request candidate moves from the engine for the current position.
   * Resolves position from gameId (DB) or from direct fen/pgn.
   * Agent picks from the returned set based on playstyle, then can call makeMove().
   */
  async requestMove(request: EngineMoveRequest): Promise<EngineMoveResponse> {
    this.logger.log(
      `requestMove gameId=${request.gameId ?? '—'} multiPv=${request.multiPv ?? 'default'} elo=${request.elo ?? '—'}`,
    );
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
    } else {
      throw new BadRequestException(
        'Provide gameId, fen, or pgn to request moves',
      );
    }

    const result = await this.chessEngineService.getCandidateMoves(fen, {
      multiPv: request.multiPv,
      movetimeMs: request.movetimeMs,
      elo: request.elo,
    });
    this.logger.log(
      `requestMove returning ${result.candidates.length} candidate(s)`,
    );
    return result;
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

  /**
   * Determine winner from a terminal status and the next turn.
   * Note: after a move is applied, chess.js turn() is the *next* player to move.
   */
  private determineWinner(status: GameStatus, nextTurn: Color): Winner | null {
    if (status === GameStatus.CHECKMATE) {
      return nextTurn === Color.WHITE ? Winner.BLACK : Winner.WHITE;
    }
    if (status === GameStatus.DRAW || status === GameStatus.STALEMATE) {
      return Winner.DRAW;
    }
    return null;
  }

  /**
   * Strip PGN header tags (e.g. [Event "..."]) and return movetext only.
   * Keeps the move list starting at "1." so DB storage is compact and readable.
   */
  private stripPgnHeaders(pgn: string): string {
    const trimmed = pgn.trim();
    const parts = trimmed.split(/\r?\n\r?\n/);
    const last = parts[parts.length - 1] ?? '';
    const candidate = last.trim();
    if (candidate !== '') return candidate;

    return trimmed
      .replace(/^\s*\[[^\]]+\]\s*$/gm, '')
      .replace(/\r?\n{2,}/g, '\n')
      .trim();
  }
}
