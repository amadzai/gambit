import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Agent, Prisma } from '../../../../generated/prisma/client.js';
import type {
  AgentStats,
  AgentWithStats,
} from '../interfaces/agent-chess.interface.js';

@Injectable()
export class AgentCrudService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new agent record.
   * Used by the Agent API when an agent is first registered.
   */
  async create(args: Prisma.AgentCreateArgs): Promise<Agent> {
    return this.prisma.agent.create(args);
  }

  /**
   * Update an existing agent with a partial payload.
   * Only fields present in the input are updated.
   */
  async update(args: Prisma.AgentUpdateArgs): Promise<Agent> {
    try {
      return await this.prisma.agent.update(args);
    } catch {
      throw new NotFoundException(
        `Agent not found for criteria: ${JSON.stringify(args.where)}`,
      );
    }
  }

  /**
   * Get a single agent by id, including computed game stats.
   */
  async get(where: Prisma.AgentWhereUniqueInput): Promise<AgentWithStats> {
    const agent = await this.prisma.agent.findUnique({ where });
    if (!agent) {
      throw new NotFoundException(
        `Agent not found for criteria: ${JSON.stringify(where)}`,
      );
    }
    const statsMap = await this.computeStatsForAgents([agent.id]);
    return { ...agent, ...statsMap[agent.id] };
  }

  /**
   * List agents (newest first), including computed game stats.
   */
  async list(args?: Prisma.AgentFindManyArgs): Promise<AgentWithStats[]> {
    const agents = await this.prisma.agent.findMany(args);
    if (agents.length === 0) return [];

    const agentIds = agents.map((a) => a.id);
    const statsMap = await this.computeStatsForAgents(agentIds);

    return agents.map((agent) => ({ ...agent, ...statsMap[agent.id] }));
  }

  /**
   * Compute win/loss/draw stats for the given agent IDs from ChessGame records.
   * Only completed (non-ACTIVE) games are counted.
   */
  private async computeStatsForAgents(
    agentIds: string[],
  ): Promise<Record<string, AgentStats>> {
    const defaultStats = (): AgentStats => ({
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
      winRate: 0,
    });

    // Initialise map with defaults
    const map: Record<string, AgentStats> = {};
    for (const id of agentIds) {
      map[id] = defaultStats();
    }

    // Fetch all completed games involving any of the given agents in one query
    const games = await this.prisma.chessGame.findMany({
      where: {
        status: { not: 'ACTIVE' },
        OR: [
          { whiteAgentId: { in: agentIds } },
          { blackAgentId: { in: agentIds } },
        ],
      },
      select: {
        whiteAgentId: true,
        blackAgentId: true,
        winner: true,
      },
    });

    for (const game of games) {
      const { whiteAgentId, blackAgentId, winner } = game;

      // Tally for white agent (if in our set)
      if (map[whiteAgentId]) {
        map[whiteAgentId].totalGames++;
        if (winner === 'WHITE') map[whiteAgentId].wins++;
        else if (winner === 'BLACK') map[whiteAgentId].losses++;
        else if (winner === 'DRAW') map[whiteAgentId].draws++;
      }

      // Tally for black agent (if in our set)
      if (map[blackAgentId]) {
        map[blackAgentId].totalGames++;
        if (winner === 'BLACK') map[blackAgentId].wins++;
        else if (winner === 'WHITE') map[blackAgentId].losses++;
        else if (winner === 'DRAW') map[blackAgentId].draws++;
      }
    }

    // Compute win rates
    for (const id of agentIds) {
      const s = map[id];
      s.winRate =
        s.totalGames > 0
          ? Math.round((s.wins / s.totalGames) * 100 * 100) / 100
          : 0;
    }

    return map;
  }
}
