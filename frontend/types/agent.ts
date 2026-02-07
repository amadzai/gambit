export type Playstyle =
  | 'Aggressive'
  | 'Defensive'
  | 'Balanced'
  | 'Chaotic'
  | 'Positional';

export type FirstMove = 'e4' | 'd4' | 'c4' | 'Nf3' | 'g3' | 'b3' | 'f4';

export interface ChessAgent {
  id: string;
  name: string;
  personality: string;
  playstyle: Playstyle;
  firstMove: FirstMove;
  marketCap: number; // equals ELO
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  owner: string; // wallet address
  createdAt: Date;
}

export type AgentPlaystyle = 'AGGRESSIVE' | 'DEFENSIVE' | 'POSITIONAL';

export interface CreateAgentRequest {
  name: string;
  playstyle: AgentPlaystyle;
  creator?: string;
  opening?: string;
  personality?: string;
  profileImage?: string;
  elo?: number;
  tokenAddress?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  playstyle?: AgentPlaystyle;
  creator?: string;
  opening?: string;
  personality?: string;
  profileImage?: string;
  elo?: number;
  tokenAddress?: string;
}

export interface Agent {
  id: string;
  name: string;
  playstyle: AgentPlaystyle;
  creator?: string | null;
  opening?: string | null;
  personality?: string | null;
  profileImage?: string | null;
  walletAddress?: string | null;
  tokenAddress?: string | null;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  createdAt: string;
  updatedAt: string;
}
