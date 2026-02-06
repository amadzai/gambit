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
