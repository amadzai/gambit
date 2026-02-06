import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentService } from '../../service-modules/agent-service/providers/agent-chess.service.js';
import { AgentCrudService } from '../../service-modules/agent-service/providers/agent-crud.service.js';
import {
  AgentMoveDto,
  CreateAgentDto,
  UpdateAgentDto,
} from './dto/agent.dto.js';
import {
  AgentMoveResponseDto,
  AgentResponseDto,
} from './dto/agent.response.dto.js';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentCrudService: AgentCrudService,
    private readonly agentService: AgentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: CreateAgentDto })
  @ApiResponse({
    status: 201,
    description: 'Agent created successfully',
    type: AgentResponseDto,
  })
  async create(@Body() dto: CreateAgentDto): Promise<AgentResponseDto> {
    return this.agentCrudService.create({ data: dto });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: UpdateAgentDto })
  @ApiResponse({
    status: 200,
    description: 'Agent updated successfully',
    type: AgentResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    return this.agentCrudService.update({
      where: { id },
      data: dto,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List agents' })
  @ApiResponse({
    status: 200,
    description: 'Agents retrieved successfully',
    type: [AgentResponseDto],
  })
  async list(): Promise<AgentResponseDto[]> {
    return this.agentCrudService.list({ orderBy: { createdAt: 'desc' } });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({
    status: 200,
    description: 'Agent retrieved successfully',
    type: AgentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async get(@Param('id') id: string): Promise<AgentResponseDto> {
    return this.agentCrudService.get({ id });
  }

  @Post(':id/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Make a move for an agent (Stockfish candidates + LLM selection)',
  })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: AgentMoveDto })
  @ApiResponse({
    status: 200,
    description: 'Agent move applied successfully',
    type: AgentMoveResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid move or game not active' })
  @ApiResponse({ status: 404, description: 'Agent or game not found' })
  async move(
    @Param('id') id: string,
    @Body() dto: AgentMoveDto,
  ): Promise<AgentMoveResponseDto> {
    return this.agentService.makeAgentMove(id, {
      gameId: dto.gameId,
      multiPv: dto.multiPv,
      movetimeMs: dto.movetimeMs,
    });
  }
}
