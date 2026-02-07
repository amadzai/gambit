export type ChessColor = 'WHITE' | 'BLACK';

export type ChessGameStatus =
  | 'ACTIVE'
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'DRAW'
  | 'RESIGNED';

export type ChessWinner = 'WHITE' | 'BLACK' | 'DRAW';

export type ChessGame = {
  id: string;
  fen: string;
  pgn: string;
  turn: ChessColor;
  status: ChessGameStatus;
  winner?: ChessWinner | null;
  whiteAgentId: string;
  blackAgentId: string;
  createdAt: string; // ISO date string from backend JSON serialization
  updatedAt: string; // ISO date string from backend JSON serialization
};

export type ListGamesParams = {
  status?: ChessGameStatus;
  agentId?: string;
  take?: number;
  skip?: number;
};
