import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Chess, Square } from 'chess.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChessRulesService } from '../../chess-service/providers/chess-rules.service.js';
import { EngineMoveResponse } from '../../chess-service/interfaces/chess-engine.interface.js';
import { MakeMoveDto } from '../../chess-service/interfaces/chess-rules.interface.js';
import { OpenRouterService } from './openrouter.service.js';
import {
  Agent,
  Color,
  Playstyle,
} from '../../../../generated/prisma/client.js';
import type {
  AgentMoveRequest,
  AgentMoveResponse,
} from '../interfaces/agent-service.interface.js';

const DEFAULT_MULTI_PV = 10;
const UCI_REGEX = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chessRulesService: ChessRulesService,
    private readonly openRouterService: OpenRouterService,
  ) {}

  /**
   * Make a single move for the given agent in the given game.
   *
   * Flow:
   * - Fetch agent config (playstyle/opening/elo)
   * - Ask Stockfish for MultiPV candidate moves at that strength
   * - Prefer opening match if opening is a UCI move present in candidates
   * - Otherwise ask OpenRouter to pick one candidate based on playstyle
   * - Apply the chosen move via ChessRulesService.makeMove()
   * - Fall back to Stockfish top candidate if the LLM output is invalid
   */
  async makeAgentMove(
    agentId: string,
    req: AgentMoveRequest,
  ): Promise<AgentMoveResponse> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent)
      throw new NotFoundException(`Agent with ID ${agentId} not found`);

    const game = await this.chessRulesService.getGame(req.gameId);
    const expectedTurn =
      game.whiteAgentId === agentId
        ? Color.WHITE
        : game.blackAgentId === agentId
          ? Color.BLACK
          : null;
    if (!expectedTurn) {
      throw new BadRequestException(
        `Agent ${agentId} is not assigned to game ${req.gameId}`,
      );
    }
    if (game.turn !== expectedTurn) {
      throw new BadRequestException(
        `Not agent's turn. game.turn=${game.turn} agentColor=${expectedTurn}`,
      );
    }

    const engine = await this.chessRulesService.requestMove({
      gameId: req.gameId,
      elo: agent.elo,
      multiPv: req.multiPv ?? DEFAULT_MULTI_PV,
      movetimeMs: req.movetimeMs,
      depth: req.depth,
    });

    if (!engine.candidates || engine.candidates.length === 0) {
      throw new BadRequestException('Engine returned no candidate moves');
    }

    const preferredOpening = this.normalizePreferredOpening(agent.opening);
    const openingMatch =
      preferredOpening &&
      engine.candidates.find((c) => c.uci.toLowerCase() === preferredOpening);

    let selectedUci: string | null = null;
    let fallbackUsed = false;

    if (openingMatch) {
      selectedUci = openingMatch.uci;
      this.logger.log(`Opening match selected uci=${selectedUci}`);
    } else {
      try {
        this.logger.log(
          `LLM selection start agentId=${agent.id} playstyle=${agent.playstyle} candidates=${engine.candidates.length}`,
        );
        selectedUci = await this.chooseCandidateWithLlm(agent, engine);
        this.logger.log(`LLM selection result uci=${selectedUci ?? '—'}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`LLM selection error: ${msg}`);
        selectedUci = null;
      }
      const allowed = new Set(engine.candidates.map((c) => c.uci));
      if (!selectedUci || !allowed.has(selectedUci)) {
        fallbackUsed = true;
        selectedUci = engine.candidates[0].uci;
        this.logger.warn(
          `LLM selection invalid; falling back to top candidate uci=${selectedUci}`,
        );
      }
    }

    const appliedMove = this.uciToMoveDto(selectedUci);
    const moveResult = await this.chessRulesService.makeMove(
      req.gameId,
      appliedMove,
    );

    return {
      agent,
      engine,
      selectedUci,
      appliedMove,
      moveResult,
      fallbackUsed,
    };
  }

  /**
   * Normalize a preferred opening string into a UCI move (e.g. `e2e4`) when possible.
   * If the value is not a UCI-looking string, return null (treated as a hint only).
   */
  private normalizePreferredOpening(opening?: string | null): string | null {
    if (!opening) return null;
    const trimmed = opening.trim().toLowerCase();
    if (trimmed === '') return null;
    // Only auto-match openings that look like UCI (e2e4 / e7e8q).
    return UCI_REGEX.test(trimmed) ? trimmed : null;
  }

  /**
   * Convert a UCI move string into `{ from, to, promotion? }` for ChessRulesService.makeMove().
   */
  private uciToMoveDto(uci: string): MakeMoveDto {
    const move = uci.trim().toLowerCase();
    if (!UCI_REGEX.test(move)) {
      throw new BadRequestException(`Invalid UCI move: "${uci}"`);
    }
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);
    const promotion =
      move.length === 5 ? (move[4] as 'q' | 'r' | 'b' | 'n') : undefined;
    return { from, to, promotion };
  }

  /**
   * Ask the LLM to choose one candidate UCI move from the engine output.
   * Returns null if parsing/validation fails.
   */
  private async chooseCandidateWithLlm(
    agent: Agent,
    engine: EngineMoveResponse,
  ): Promise<string | null> {
    const enriched = engine.candidates.map((c, idx) => {
      const meta = this.enrichCandidateMoves(engine.fen, c.uci);
      return {
        i: idx + 1,
        uci: c.uci,
        san: meta?.san ?? null,
        isCapture: meta?.isCapture ?? null,
        givesCheck: meta?.givesCheck ?? null,
        scoreCp: c.scoreCp ?? null,
        mate: c.mate ?? null,
      };
    });

    const playstyleGuidance = this.playstyleGuidance(agent.playstyle);
    const sideToMove = engine.fen.split(/\s+/)[1] === 'b' ? 'BLACK' : 'WHITE';
    const allowedUcis = engine.candidates.map((c) => c.uci).join(', ');
    const maxPick = engine.candidates.length;
    // const personalityHint =
    //   agent.personality && agent.personality.trim() !== ''
    //     ? `Personality: "${agent.personality.trim()}".`
    //     : 'No personality.';

    const prompt = [
      `You are a chess agent. Choose exactly ONE move from the provided candidates.`,
      `It is ${sideToMove} to move.`,
      `Playstyle: ${agent.playstyle}. ${playstyleGuidance}`,
      // personalityHint,
      `You MUST choose by index from the candidate list.`,
      `Valid pick values are integers from 1 to ${maxPick} (inclusive).`,
      `Do NOT output a UCI move. Do NOT invent a new move. If unsure, pick 1.`,
      `Return ONLY valid JSON like: {"pick": 3}`,
      `Allowed UCI moves are: ${allowedUcis}`,
      `Candidates (1 = best by engine, higher = weaker):`,
      JSON.stringify(enriched),
    ].join('\n');

    const content = await this.openRouterService.createChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You must output only JSON. Do not include code fences or extra text. Output must be like {"pick": <number>}.',
        },
        { role: 'user', content: prompt },
      ],
      maxTokens: 60,
      temperature: 0.2,
      timeoutMs: 12_000,
    });

    const parsed = this.parseJsonObject<{ pick?: number }>(content);
    const pick = parsed?.pick;
    if (typeof pick !== 'number' || !Number.isFinite(pick)) return null;
    const idx = Math.floor(pick) - 1;
    if (idx < 0 || idx >= engine.candidates.length) return null;
    const uci = engine.candidates[idx]?.uci;
    return uci && UCI_REGEX.test(uci.toLowerCase()) ? uci.toLowerCase() : null;
  }

  /**
   * Convert a playstyle enum to a short selection heuristic for the prompt.
   */
  private playstyleGuidance(playstyle: Playstyle): string {
    switch (playstyle) {
      case Playstyle.AGGRESSIVE:
        return 'Prefer tactical pressure, captures, checks, and forcing lines when reasonable.';
      case Playstyle.DEFENSIVE:
        return 'Prefer safe, solid moves that improve king safety and reduce risk.';
      case Playstyle.POSITIONAL:
        return 'Prefer improving piece placement, pawn structure, and long-term advantages; avoid unnecessary tactics.';
      default:
        return 'Choose a sensible move.';
    }
  }

  /**
   * Enrich a UCI candidate move with a few lightweight chess.js-derived features
   * (SAN, capture/check flags) to help the LLM choose among candidates.
   */
  private enrichCandidateMoves(
    fen: string,
    uci: string,
  ): { san: string; isCapture: boolean; givesCheck: boolean } | null {
    try {
      const chess = new Chess(fen);
      const dto = this.uciToMoveDto(uci);
      const move = chess.move({
        from: dto.from as Square,
        to: dto.to as Square,
        promotion: dto.promotion,
      });
      if (!move) return null;
      const givesCheck = chess.isCheck();
      const isCapture = move.isCapture() || move.isEnPassant();
      return { san: move.san, isCapture, givesCheck };
    } catch {
      return null;
    }
  }

  /**
   * Parse a JSON object from model output. If the output includes extra text,
   * attempts to extract the first `{...}` block.
   */
  private parseJsonObject<T>(text: string): T | null {
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) return null;
      const slice = trimmed.slice(start, end + 1);
      try {
        return JSON.parse(slice) as T;
      } catch {
        return null;
      }
    }
  }
}
