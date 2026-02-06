import type { Playstyle } from '../../../../generated/prisma/client.js';

/**
 * Input for creating a new agent record.
 */
export type CreateAgentInput = {
  /** Agent display name. */
  name: string;
  /** Agent playstyle (used for LLM move selection heuristics). */
  playstyle: Playstyle;
  /** Preferred opening hint (optional; can be free-form or UCI like e2e4). */
  opening?: string | null;
  /** Personality hint for the LLM (optional). */
  personality?: string | null;
  /** Profile image URL (optional; stored externally like Supabase). */
  profileImage?: string | null;
  /** Agent ELO used for Stockfish strength mapping. */
  elo?: number;
};

/**
 * Input for updating an existing agent record (partial update).
 */
export type UpdateAgentInput = Partial<CreateAgentInput>;
