export type ChessColor = 'WHITE' | 'BLACK';

export type ChessGameStatus =
  | 'ACTIVE'
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'DRAW'
  | 'RESIGNED';

export type ChessGame = {
  id: string;
  fen: string;
  pgn: string;
  turn: ChessColor;
  status: ChessGameStatus;
  createdAt: string; // ISO date string from backend JSON serialization
  updatedAt: string; // ISO date string from backend JSON serialization
};

export type ChessMovePromotion = 'q' | 'r' | 'b' | 'n';

export type MakeMovePayload = {
  from: string; // e.g. "e2"
  to: string; // e.g. "e4"
  promotion?: ChessMovePromotion; // pawn promotion piece
};

export type ChessMove = {
  from: string;
  to: string;
  san: string;
  piece: string;
  color: string;
  captured?: string;
  promotion?: string;
  flags: string;
};

export type MoveResultResponse = {
  success: boolean;
  game: ChessGame;
  move?: ChessMove;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
};

export type GameStatusResponse = {
  game: ChessGame;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  legalMoveCount: number;
};

export type EngineCandidateMove = {
  uci: string; // e.g. "e2e4", "e7e8q"
  multipv: number; // 1-based
  depth: number;
  scoreCp?: number;
  mate?: number;
  pv?: string;
};

export type EngineMovesResponse = {
  fen: string;
  candidates: EngineCandidateMove[];
};

export type EngineMovesQuery = {
  multiPv?: number;
  elo?: number;
  skill?: number;
  movetimeMs?: number;
  depth?: number;
};

