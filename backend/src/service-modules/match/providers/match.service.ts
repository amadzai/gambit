import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { Color, GameStatus } from '../../../../generated/prisma/client.js';
import { ChessRulesService } from '../../chess-service/providers/chess-rules.service.js';
import { AgentService } from '../../agent-service/providers/agent-chess.service.js';
import type {
  MatchStartRequest,
  MatchMoveEvent,
} from '../interfaces/match.interface.js';

const DEFAULT_MULTI_PV = 10;
const DEFAULT_MOVETIME_MS = 1500;
// const DEFAULT_DELAY_MS = 2000;

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  /** Active match streams keyed by gameId. */
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly agentService: AgentService,
    private readonly chessRulesService: ChessRulesService,
  ) {}

  /**
   * Create a game and kick off the match loop in the background.
   * Returns the gameId immediately so the client can subscribe to the SSE stream.
   */
  async startMatch(req: MatchStartRequest): Promise<{ gameId: string }> {
    const game = await this.chessRulesService.createGame({
      whiteAgentId: req.whiteAgentId,
      blackAgentId: req.blackAgentId,
    });

    const subject = new Subject<MessageEvent>();
    this.streams.set(game.id, subject);

    this.logger.log(
      `Match started gameId=${game.id} white=${req.whiteAgentId} black=${req.blackAgentId}`,
    );

    this.runMatchLoop(game.id, req.whiteAgentId, req.blackAgentId, {
      multiPv: req.multiPv,
      movetimeMs: req.movetimeMs,
      delayMs: req.delayMs,
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Match loop fatal error gameId=${game.id}: ${message}`);
    });

    return { gameId: game.id };
  }

  /**
   * Get the SSE observable for an active match.
   */
  getMatchStream(gameId: string): Observable<MessageEvent> {
    const subject = this.streams.get(gameId);
    if (!subject) {
      throw new NotFoundException(
        `No active match stream for gameId=${gameId}`,
      );
    }
    return subject.asObservable();
  }

  /**
   * The core match loop. Alternates agent moves until the game is no longer ACTIVE.
   */
  private async runMatchLoop(
    gameId: string,
    whiteAgentId: string,
    blackAgentId: string,
    opts: { multiPv?: number; movetimeMs?: number; delayMs?: number },
  ): Promise<void> {
    const subject = this.streams.get(gameId);
    if (!subject) return;

    const multiPv = opts.multiPv ?? DEFAULT_MULTI_PV;
    const movetimeMs = opts.movetimeMs ?? DEFAULT_MOVETIME_MS;
    // const delayMs = opts.delayMs ?? DEFAULT_DELAY_MS;

    let halfMoveCount = 0;

    try {
      while (true) {
        const game = await this.chessRulesService.getGame(gameId);

        if (game.status !== GameStatus.ACTIVE) {
          this.logger.log(
            `Match ended gameId=${gameId} status=${game.status} winner=${game.winner ?? 'none'}`,
          );
          break;
        }

        const isWhiteTurn = game.turn === Color.WHITE;
        const currentAgentId = isWhiteTurn ? whiteAgentId : blackAgentId;

        this.logger.log(
          `Half-move #${halfMoveCount + 1} gameId=${gameId} turn=${game.turn} agentId=${currentAgentId}`,
        );

        const result = await this.agentService.makeAgentMove(currentAgentId, {
          gameId,
          multiPv,
          movetimeMs,
        });

        halfMoveCount++;

        const moveNumber = Math.ceil(halfMoveCount / 2);

        // Find the selected candidate to extract eval.
        const selectedCandidate = result.engine.candidates.find(
          (c) => c.uci === result.selectedUci,
        );

        // Normalize eval to white's perspective.
        // Engine scores are from the side-to-move's perspective (before the move).
        // If white moved, score is already from white's POV. If black moved, negate.
        const sign = isWhiteTurn ? 1 : -1;
        const evalCp =
          selectedCandidate?.scoreCp != null
            ? selectedCandidate.scoreCp * sign
            : null;
        const evalMate =
          selectedCandidate?.mate != null
            ? selectedCandidate.mate * sign
            : null;

        const event: MatchMoveEvent = {
          gameId,
          moveNumber,
          fen: result.moveResult.game.fen,
          pgn: result.moveResult.game.pgn,
          san: result.moveResult.move?.san ?? result.selectedUci,
          selectedUci: result.selectedUci,
          turn: result.moveResult.game.turn,
          status: result.moveResult.game.status,
          winner: result.moveResult.game.winner,
          evalCp,
          evalMate,
          agentId: result.agent.id,
          agentName: result.agent.name,
          fallbackUsed: result.fallbackUsed,
        };

        subject.next({ data: event } as MessageEvent);

        if (result.moveResult.game.status !== GameStatus.ACTIVE) {
          this.logger.log(
            `Match ended gameId=${gameId} status=${result.moveResult.game.status} winner=${result.moveResult.game.winner ?? 'none'} halfMoves=${halfMoveCount}`,
          );
          break;
        }

        // Pause between moves so the frontend can animate.
        // await this.sleep(delayMs);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Match loop error gameId=${gameId}: ${msg}`);
      subject.next({
        data: { error: msg, gameId },
        type: 'error',
      } as MessageEvent);
    } finally {
      subject.complete();
      this.streams.delete(gameId);
      this.logger.log(`Match stream closed gameId=${gameId}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
