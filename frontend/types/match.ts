import type { ChessColor, ChessGameStatus } from './chess';

/** Winner value returned by the backend match stream. */
export type MatchWinner = 'WHITE' | 'BLACK' | 'DRAW';

/** Request body for POST /match/start. */
export interface StartMatchRequest {
  whiteAgentId: string;
  blackAgentId: string;
  /** Number of Stockfish candidate moves (MultiPV). Default 10. */
  multiPv?: number;
  /** Stockfish analysis time in milliseconds. Default 200. */
  movetimeMs?: number;
  /** Delay between moves in milliseconds (for frontend animation pacing). Default 2000. */
  delayMs?: number;
}

/** Response from POST /match/start. */
export interface StartMatchResponse {
  gameId: string;
}

/** Payload pushed via SSE after each move in a match. */
export interface MatchMoveEvent {
  gameId: string;
  /** Chess full-move number (1-based). */
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
  turn: ChessColor;
  /** Game status after the move. */
  status: ChessGameStatus;
  /** Winner (set on terminal states). */
  winner?: MatchWinner | null;
  /** Centipawn eval of the selected move, normalized to white's perspective. Null if mate. */
  evalCp: number | null;
  /** Mate-in-N for the selected move, normalized to white's perspective. Null if not a mate line. */
  evalMate: number | null;
  /** Agent that made this move. */
  agentId: string;
  /** Display name of the agent that made this move. */
  agentName: string;
  /** True when the LLM output was invalid and Stockfish top-candidate was used. */
  fallbackUsed: boolean;
}
