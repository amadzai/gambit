import type { Playstyle } from '../../../../generated/prisma/client.js';

export type CreateAgentInput = {
  name: string;
  playstyle: Playstyle;
  opening?: string | null;
  personality?: string | null;
  profileImage?: string | null;
  elo?: number;
};

export type UpdateAgentInput = Partial<CreateAgentInput>;
