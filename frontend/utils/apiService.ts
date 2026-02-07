import axios from 'axios';
import type { ChessGame, ListGamesParams } from '@/types/chess';
import type { Agent, CreateAgentRequest } from '@/types/agent';
import type { StartMatchRequest, StartMatchResponse } from '@/types/match';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export const apiService = {
  chess: {
    getGames: async (params?: ListGamesParams): Promise<ChessGame[]> => {
      const res = await api.get<ChessGame[]>('/chess/games', { params });
      return res.data;
    },

    getGameById: async (gameId: string): Promise<ChessGame> => {
      const res = await api.get<ChessGame>(`/chess/games/${gameId}`);
      return res.data;
    },
  },

  agent: {
    create: async (data: CreateAgentRequest): Promise<Agent> => {
      const res = await api.post<Agent>('/agent', data);
      return res.data;
    },

    list: async (): Promise<Agent[]> => {
      const res = await api.get<Agent[]>('/agent');
      return res.data;
    },

    getById: async (id: string): Promise<Agent> => {
      const res = await api.get<Agent>(`/agent/${id}`);
      return res.data;
    },
  },

  match: {
    start: async (data: StartMatchRequest): Promise<StartMatchResponse> => {
      const res = await api.post<StartMatchResponse>('/match/start', data);
      return res.data;
    },

    /**
     * SSE stream for an active match.
     * Returns an EventSource. Attach `onmessage` to receive `MatchMoveEvent` payloads.
     *
     * @example
     * const es = apiService.match.stream('some-game-id');
     * es.onmessage = (e) => {
     *   const move: MatchMoveEvent = JSON.parse(e.data);
     *   console.log(move);
     * };
     * es.onerror = () => es.close();
     */
    stream: (gameId: string): EventSource => {
      return new EventSource(`${API_BASE_URL}/match/${gameId}/stream`);
    },
  },
};
