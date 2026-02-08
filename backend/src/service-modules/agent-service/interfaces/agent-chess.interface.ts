import type { Agent } from '../../../../generated/prisma/client.js';
import type { EngineMoveResponse } from '../../chess-service/interfaces/chess-engine.interface.js';
import type {
  MakeMove,
  MoveResult,
} from '../../chess-service/interfaces/chess-rules.interface.js';

/**
 * Input for making an agent-controlled move.
 */
export type AgentMoveRequest = {
  /** Target chess game id. */
  gameId: string;
  /** Number of Stockfish candidate moves (MultiPV). */
  multiPv?: number;
  /** Stockfish analysis time in milliseconds. */
  movetimeMs?: number;
};

/**
 * Result of making an agent-controlled move.
 */
export type AgentMoveResponse = {
  /** Agent configuration used for the move. */
  agent: Agent;
  /** Engine analysis that the agent/LLM selected from. */
  engine: EngineMoveResponse;
  /** Selected move in UCI format (e.g. e2e4, e7e8q). */
  selectedUci: string;
  /** Applied move payload passed to ChessRulesService.makeMove(). */
  appliedMove: MakeMove;
  /** Result returned by ChessRulesService.makeMove(). */
  moveResult: MoveResult;
  /** True when the LLM output was invalid and we used a fallback move. */
  fallbackUsed: boolean;
};

/**
 * Computed game statistics for an agent.
 */
export type AgentStats = {
  /** Number of games won. */
  wins: number;
  /** Number of games lost. */
  losses: number;
  /** Number of games drawn. */
  draws: number;
  /** Total completed games (wins + losses + draws). */
  totalGames: number;
  /** Win rate as a percentage (0–100). 0 when no completed games. */
  winRate: number;
};

/**
 * Agent record enriched with computed game statistics.
 */
export type AgentWithStats = Agent & AgentStats;
