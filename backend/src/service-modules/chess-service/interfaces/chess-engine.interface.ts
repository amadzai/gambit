/**
 * Input for requesting candidate moves from the chess engine (Stockfish).
 * Position is resolved either by gameId (DB) or by direct fen/pgn.
 */
export interface EngineMoveRequest {
  /** Load position from this game (pgn if present, else fen). */
  gameId?: string;
  /** Number of principal variations (candidate moves) to return. Default 10. */
  multiPv?: number;
  /** Analysis time in milliseconds. */
  movetimeMs?: number;
  /** Agent ELO for strength (mapped to Stockfish UCI_Elo). */
  elo?: number;
}

/**
 * One candidate move from the engine (first move of a principal variation).
 */
export interface EngineCandidateMove {
  /** UCI move (e.g. e2e4, e7e8q). */
  uci: string;
  /** Principal variation index (1-based). */
  multipv: number;
  /** Depth reached for this line. */
  depth: number;
  /** Centipawn score (positive = better for side to move). Undefined if mate. */
  scoreCp?: number;
  /** Mate in N moves (positive = we deliver mate). Undefined if not mate. */
  mate?: number;
  /** Full principal variation in UCI (optional). */
  pv?: string;
}

/**
 * Result of requesting candidate moves from the engine.
 */
export interface EngineMoveResponse {
  /** FEN of the position that was analyzed. */
  fen: string;
  /** Candidate moves (one per MultiPV line), ordered by strength. */
  candidates: EngineCandidateMove[];
}
