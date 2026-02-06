import axios from 'axios';
import type { ChessGame } from '@/types/chess';

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
  },
};
