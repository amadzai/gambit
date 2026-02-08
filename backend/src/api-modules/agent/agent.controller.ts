import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
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
import { decodeEventLog } from 'viem';
import { WalletManagerService } from '../../service-modules/goat/wallet/wallet-manager.service.js';
import { AgentService } from '../../service-modules/agent-service/providers/agent-chess.service.js';
import { AgentCrudService } from '../../service-modules/agent-service/providers/agent-crud.service.js';
import {
  AgentMoveDto,
  CreateAgentDto,
  ExecuteAgentActionDto,
  ManageReservesDto,
  RegisterTokenDto,
  UpdateAgentDto,
} from './dto/agent.dto.js';
import {
  AgentMoveResponseDto,
  AgentResponseDto,
  ExecuteAgentActionResponseDto,
} from './dto/agent.response.dto.js';
import { GoatService } from '../../service-modules/goat/goat.service.js';
import { agentFactoryAbi } from '../../service-modules/goat/plugins/gambit/abis/agent-factory.abi.js';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(
    private readonly agentCrudService: AgentCrudService,
    private readonly agentService: AgentService,
    private readonly walletManager: WalletManagerService,
    private readonly goatService: GoatService,
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
    const { address: walletAddress, privateKey } =
      this.walletManager.generateNewKeyPair();
    const encryptedPrivateKey =
      this.walletManager.encryptPrivateKey(privateKey);
    const agent = await this.agentCrudService.create({
      data: {
        ...dto,
        walletAddress,
        encryptedPrivateKey,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPrivateKey: _, ...response } = agent;
    return response as AgentResponseDto;
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
    const agent = await this.agentCrudService.update({
      where: { id },
      data: dto,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPrivateKey: _, ...response } = agent;
    return response as AgentResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'List agents' })
  @ApiResponse({
    status: 200,
    description: 'Agents retrieved successfully',
    type: [AgentResponseDto],
  })
  async list(): Promise<AgentResponseDto[]> {
    const agents = await this.agentCrudService.list({
      orderBy: { createdAt: 'desc' },
    });
    return agents.map((agent) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { encryptedPrivateKey: _, ...response } = agent;
      return response as AgentResponseDto;
    });
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
    const agent = await this.agentCrudService.get({ id });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPrivateKey: _, ...response } = agent;
    return response as AgentResponseDto;
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

  @Post(':id/register-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Register an on-chain token for an agent by providing the AgentFactory tx hash',
  })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: RegisterTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token address extracted and stored successfully',
    type: AgentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agent not found or event not found in tx' })
  async registerToken(
    @Param('id') id: string,
    @Body() dto: RegisterTokenDto,
  ): Promise<AgentResponseDto> {
    // Ensure the agent exists
    await this.agentCrudService.get({ id });

    const publicClient = this.walletManager.getPublicClient();
    const receipt = await publicClient.getTransactionReceipt({
      hash: dto.txHash as `0x${string}`,
    });

    // Find the AgentCreated event in the logs
    let tokenAddress: string | undefined;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: agentFactoryAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'AgentCreated') {
          tokenAddress = (decoded.args as { tokenAddress: string }).tokenAddress;
          break;
        }
      } catch {
        // Not an AgentCreated event from this ABI, skip
      }
    }

    if (!tokenAddress) {
      throw new NotFoundException(
        'AgentCreated event not found in the transaction receipt',
      );
    }

    this.logger.log(
      `Registering token ${tokenAddress} for agent ${id} from tx ${dto.txHash}`,
    );

    const agent = await this.agentCrudService.update({
      where: { id },
      data: { tokenAddress },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPrivateKey: _, ...response } = agent;
    return response as AgentResponseDto;
  }

  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a GOAT action for an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: ExecuteAgentActionDto })
  @ApiResponse({
    status: 200,
    description: 'Agent action executed successfully',
    type: ExecuteAgentActionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async executeAction(
    @Param('id') id: string,
    @Body() dto: ExecuteAgentActionDto,
  ): Promise<ExecuteAgentActionResponseDto> {
    await this.agentCrudService.get({ id });

    const result = await this.goatService.executeAgentAction(
      id,
      dto.context,
      dto.systemPrompt,
    );

    return { result };
  }

  @Post(':id/manage-reserves')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Trigger autonomous reserve management — agent decides to save, buyback, or reward creator',
  })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: ManageReservesDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Reserve management decision executed',
    type: ExecuteAgentActionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agent not found or missing token address' })
  async manageReserves(
    @Param('id') id: string,
    @Body() dto?: ManageReservesDto,
  ): Promise<ExecuteAgentActionResponseDto> {
    const result = await this.goatService.manageReserves(id, dto?.hint);
    return { result };
  }
}
