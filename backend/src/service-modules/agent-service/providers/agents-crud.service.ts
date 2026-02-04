import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Agent, Playstyle } from '../../../../generated/prisma/client.js';

export type CreateAgentInput = {
  name: string;
  playstyle: Playstyle;
  opening?: string | null;
  personality?: string | null;
  profileImage?: string | null;
  elo?: number;
};

export type UpdateAgentInput = Partial<CreateAgentInput>;

@Injectable()
export class AgentsCrudService {
  constructor(private readonly prisma: PrismaService) {}

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

  async get(agentId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }
    return agent;
  }

  async list(): Promise<Agent[]> {
    return this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
