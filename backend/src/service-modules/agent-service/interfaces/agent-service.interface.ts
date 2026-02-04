import type { Agent } from '../../../../generated/prisma/client.js';
import type { EngineMoveResponse } from '../../chess-service/interfaces/chess-engine.interface.js';
import type {
  MakeMoveDto,
  MoveResult,
} from '../../chess-service/interfaces/chess-rules.interface.js';

export type AgentMoveRequest = {
  gameId: string;
  multiPv?: number;
  movetimeMs?: number;
  depth?: number;
};

export type AgentMoveResponse = {
  agent: Agent;
  engine: EngineMoveResponse;
  selectedUci: string;
  appliedMove: MakeMoveDto;
  moveResult: MoveResult;
  fallbackUsed: boolean;
};
