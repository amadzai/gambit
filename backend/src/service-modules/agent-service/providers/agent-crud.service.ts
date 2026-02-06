import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Agent, Prisma } from '../../../../generated/prisma/client.js';

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
   * Get a single agent by id.
   */
  async get(where: Prisma.AgentWhereUniqueInput): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({ where });
    if (!agent) {
      throw new NotFoundException(
        `Agent not found for criteria: ${JSON.stringify(where)}`,
      );
    }
    return agent;
  }

  /**
   * List agents (newest first).
   */
  async list(args?: Prisma.AgentFindManyArgs): Promise<Agent[]> {
    return this.prisma.agent.findMany(args);
  }
}
