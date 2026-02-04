import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Agent } from '../../../../generated/prisma/client.js';
import type {
  CreateAgentInput,
  UpdateAgentInput,
} from '../interfaces/agents-crud.interface.js';

@Injectable()
export class AgentsCrudService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new agent record.
   * Used by the Agents API when an agent is first registered.
   */
  async create(input: CreateAgentInput): Promise<Agent> {
    return this.prisma.agent.create({
      data: {
        name: input.name,
        playstyle: input.playstyle,
        opening: input.opening,
        personality: input.personality,
        profileImage: input.profileImage,
        elo: input.elo,
      },
    });
  }

  /**
   * Update an existing agent with a partial payload.
   * Only fields present in the input are updated.
   */
  async update(agentId: string, input: UpdateAgentInput): Promise<Agent> {
    const data: UpdateAgentInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.playstyle !== undefined) data.playstyle = input.playstyle;
    if (input.opening !== undefined) data.opening = input.opening;
    if (input.personality !== undefined) data.personality = input.personality;
    if (input.profileImage !== undefined)
      data.profileImage = input.profileImage;
    if (input.elo !== undefined) data.elo = input.elo;

    try {
      return await this.prisma.agent.update({
        where: { id: agentId },
        data,
      });
    } catch {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }
  }

  /**
   * Get a single agent by id.
   */
  async get(agentId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }
    return agent;
  }

  /**
   * List agents (newest first).
   */
  async list(): Promise<Agent[]> {
    return this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
