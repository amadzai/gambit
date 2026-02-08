import type {
  Color,
  GameStatus,
  Winner,
} from '../../../../generated/prisma/client.js';

/**
 * Input for starting a match between two agents.
 */
export interface MatchStartRequest {
  /** White-side agent ID. */
  whiteAgentId: string;
  /** Black-side agent ID. */
  blackAgentId: string;
  /** Number of Stockfish candidate moves (MultiPV). Default 10. */
  multiPv?: number;
  /** Stockfish analysis time in milliseconds. Default 200. */
  movetimeMs?: number;
  /** Delay between moves in milliseconds (for frontend animation pacing). Default 2000. */
  delayMs?: number;
  /** On-chain match ID (bytes32) from MatchEngine contract, used for post-game settlement. */
  onChainMatchId?: string;
}

/**
 * Input for the challenge flow: on-chain challenge → accept → start chess match.
 */
export interface ChallengeRequest {
  /** Agent initiating the challenge. */
  challengerAgentId: string;
  /** Agent being challenged. */
  opponentAgentId: string;
  /** Stake amount in human-readable USDC (e.g. "1" for 1 USDC). */
  stakeAmount: string;
  /** Number of Stockfish candidate moves (MultiPV). Default 10. */
  multiPv?: number;
  /** Stockfish analysis time in milliseconds. Default 200. */
  movetimeMs?: number;
  /** Delay between moves in milliseconds. Default 2000. */
  delayMs?: number;
}

/**
 * Input for accepting an existing on-chain challenge and starting the chess match.
 */
export interface AcceptChallengeRequest {
  /** On-chain match ID (bytes32) from the ChallengeCreated event. */
  onChainMatchId: string;
  /** Agent that created the challenge (will play as white). */
  challengerAgentId: string;
  /** Agent accepting the challenge (will play as black). */
  opponentAgentId: string;
  /** Number of Stockfish candidate moves (MultiPV). Default 10. */
  multiPv?: number;
  /** Stockfish analysis time in milliseconds. Default 200. */
  movetimeMs?: number;
  /** Delay between moves in milliseconds. Default 2000. */
  delayMs?: number;
}

/**
 * Payload pushed via SSE after each move in a match.
 */
export interface MatchMoveEvent {
  /** Chess game ID. */
  gameId: string;
  /** Chess full-move number (1-based). Both white and black share the same number per turn. */
  moveNumber: number;
  /** FEN after the move. */
  fen: string;
  /** PGN after the move (movetext only, no headers). */
  pgn: string;
  /** SAN notation of the move (e.g. Nf3). */
  san: string;
  /** UCI notation of the move (e.g. g1f3). */
  selectedUci: string;
  /** Whose turn it is *after* the move. */
  turn: Color;
  /** Game status after the move. */
  status: GameStatus;
  /** Winner (set on terminal states). */
  winner?: Winner | null;
  /** Centipawn evaluation of the selected move, normalized to white's perspective. Null if mate. */
  evalCp: number | null;
  /** Mate-in-N for the selected move, normalized to white's perspective (positive = white delivers mate). Null if not a mate line. */
  evalMate: number | null;
  /** Agent that made this move. */
  agentId: string;
  /** Display name of the agent that made this move. */
  agentName: string;
  /** True when the LLM output was invalid and Stockfish top-candidate was used. */
  fallbackUsed: boolean;
}
