import axios from 'axios';
import type {
  ChessGame,
  EngineMovesQuery,
  EngineMovesResponse,
  MakeMovePayload,
  MoveResultResponse,
} from '@/types/chess';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export const apiService = {
  chess: {
    createGame: async (): Promise<ChessGame> => {
      const res = await api.post<ChessGame>('/chess/games');
      return res.data;
    },

    getGameById: async (gameId: string): Promise<ChessGame> => {
      const res = await api.get<ChessGame>(`/chess/games/${gameId}`);
      return res.data;
    },

    makeMove: async (
      gameId: string,
      payload: MakeMovePayload,
    ): Promise<MoveResultResponse> => {
      const res = await api.post<MoveResultResponse>(`/chess/games/${gameId}/move`, payload);
      return res.data;
    },

    getCandidateMovesFromStockfish: async (
      gameId: string,
      params?: EngineMovesQuery,
    ): Promise<EngineMovesResponse> => {
      const res = await api.get<EngineMovesResponse>(`/chess/games/${gameId}/engine-moves`, {
        params,
      });
      return res.data;
    },
  },
};

