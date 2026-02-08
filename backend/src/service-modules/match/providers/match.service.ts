import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { Color, GameStatus, Winner } from '../../../../generated/prisma/client.js';
import { ChessRulesService } from '../../chess-service/providers/chess-rules.service.js';
import { AgentService } from '../../agent-service/providers/agent-chess.service.js';
import { GoatService } from '../../goat/goat.service.js';
import { SettlementSignerService } from '../../goat/wallet/settlement-signer.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { matchEngineAbi } from '../../goat/plugins/gambit/abis/match-engine.abi.js';
import { getContractAddresses, baseSepolia } from '../../goat/constants/contracts.js';
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  parseUnits,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type {
  AcceptChallengeRequest,
  ChallengeRequest,
  MatchStartRequest,
  MatchMoveEvent,
} from '../interfaces/match.interface.js';

const DEFAULT_MULTI_PV = 10;
const DEFAULT_MOVETIME_MS = 1500;
// const DEFAULT_DELAY_MS = 2000;

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000' as const;

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  /** Active match streams keyed by gameId. */
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly agentService: AgentService,
    private readonly chessRulesService: ChessRulesService,
    private readonly goatService: GoatService,
    private readonly settlementSigner: SettlementSignerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a game and kick off the match loop in the background.
   * Returns the gameId immediately so the client can subscribe to the SSE stream.
   */
  async startMatch(req: MatchStartRequest): Promise<{ gameId: string }> {
    const game = await this.chessRulesService.createGame({
      whiteAgentId: req.whiteAgentId,
      blackAgentId: req.blackAgentId,
    });

    const subject = new Subject<MessageEvent>();
    this.streams.set(game.id, subject);

    this.logger.log(
      `Match started gameId=${game.id} white=${req.whiteAgentId} black=${req.blackAgentId}`,
    );

    this.runMatchLoop(game.id, req.whiteAgentId, req.blackAgentId, {
      multiPv: req.multiPv,
      movetimeMs: req.movetimeMs,
      delayMs: req.delayMs,
      onChainMatchId: req.onChainMatchId,
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Match loop fatal error gameId=${game.id}: ${message}`);
    });

    return { gameId: game.id };
  }

  /**
   * Create an on-chain challenge. The rest of the flow (accept → start match)
   * is driven by on-chain events (ChallengeCreated → ChallengeAccepted).
   */
  async challenge(
    req: ChallengeRequest,
  ): Promise<{ matchId: string; onChainMatchId: string }> {
    const { challengerAgentId, opponentAgentId, stakeAmount } = req;
    const contracts = getContractAddresses();
    const matchEngineAddress = contracts.MATCH_ENGINE;

    // 1. Validate both agents
    const [challenger, opponent] = await Promise.all([
      this.prisma.agent.findUnique({
        where: { id: challengerAgentId },
        select: {
          id: true,
          walletAddress: true,
          encryptedPrivateKey: true,
          tokenAddress: true,
        },
      }),
      this.prisma.agent.findUnique({
        where: { id: opponentAgentId },
        select: {
          id: true,
          walletAddress: true,
          encryptedPrivateKey: true,
          tokenAddress: true,
        },
      }),
    ]);

    if (!challenger)
      throw new NotFoundException(`Challenger agent ${challengerAgentId} not found`);
    if (!opponent)
      throw new NotFoundException(`Opponent agent ${opponentAgentId} not found`);
    if (!challenger.walletAddress || !challenger.encryptedPrivateKey || !challenger.tokenAddress)
      throw new BadRequestException(
        `Challenger agent ${challengerAgentId} missing walletAddress, encryptedPrivateKey, or tokenAddress`,
      );
    if (!opponent.walletAddress || !opponent.encryptedPrivateKey || !opponent.tokenAddress)
      throw new BadRequestException(
        `Opponent agent ${opponentAgentId} missing walletAddress, encryptedPrivateKey, or tokenAddress`,
      );

    const stakeAmountBaseUnits = parseUnits(stakeAmount, 6).toString();

    // 2. Agent A (challenger) — approve USDC + challenge via GOAT
    this.logger.log(
      `Challenge flow: Agent ${challengerAgentId} challenging agent ${opponentAgentId} for ${stakeAmount} USDC`,
    );

    const challengeResult = await this.goatService.executeAgentAction(
      challengerAgentId,
      `You need to challenge another agent to a chess match.
First, approve ${stakeAmount} USDC for the MatchEngine contract at ${matchEngineAddress}.
Then, call the tool named "challenge" with exactly these parameters (use the exact keys):
- myAgentToken: ${challenger.tokenAddress}
- opponentToken: ${opponent.tokenAddress}
- stakeAmount: "${stakeAmountBaseUnits}" (string, USDC base units; do not change this value)
Do this now.`,
    );

    this.logger.log(`Challenge GOAT result: ${challengeResult}`);

    // 3. Extract on-chain matchId from challenge tx receipt
    const txHash = this.extractTxHash(challengeResult);
    if (!txHash) {
      throw new BadRequestException(
        `Could not extract transaction hash from challenge result: ${challengeResult}`,
      );
    }

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.RPC_URL ?? 'https://sepolia.base.org'),
    });

    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as Hex,
    });

    let onChainMatchId: string | undefined;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: matchEngineAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'ChallengeCreated') {
          onChainMatchId = (decoded.args as { matchId: string }).matchId;
          break;
        }
      } catch {
        // Not a ChallengeCreated event, skip
      }
    }

    if (!onChainMatchId) {
      throw new BadRequestException(
        'ChallengeCreated event not found in the transaction receipt',
      );
    }

    this.logger.log(`On-chain matchId extracted: ${onChainMatchId}`);

    // 4. Create Match record in DB (status: PENDING)
    const matchRecord = await this.prisma.match.create({
      data: {
        onChainMatchId,
        agent1TokenAddress: challenger.tokenAddress,
        agent2TokenAddress: opponent.tokenAddress,
        stakeAmount,
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Challenge created — waiting for ChallengeCreated event to prompt opponent. matchId=${matchRecord.id} onChainMatchId=${onChainMatchId}`,
    );

    return {
      matchId: matchRecord.id,
      onChainMatchId,
    };
  }

  /**
   * Extract a transaction hash (0x followed by 64 hex chars) from a string.
   */
  private extractTxHash(text: string): string | null {
    const match = text.match(/0x[a-fA-F0-9]{64}/);
    return match ? match[0] : null;
  }

  /**
   * Accept an existing on-chain challenge, then start the chess match.
   * Expects a PENDING Match record already created (e.g. via challenge() or an external flow).
   */
  async acceptChallenge(
    req: AcceptChallengeRequest,
  ): Promise<{ matchId: string; onChainMatchId: string; gameId: string }> {
    const { onChainMatchId, challengerAgentId, opponentAgentId } = req;
    const contracts = getContractAddresses();
    const matchEngineAddress = contracts.MATCH_ENGINE;

    // 1. Find the PENDING match record
    const matchRecord = await this.prisma.match.findUnique({
      where: { onChainMatchId },
    });

    if (!matchRecord) {
      throw new NotFoundException(
        `No match record found for onChainMatchId=${onChainMatchId}`,
      );
    }
    if (matchRecord.status !== 'PENDING') {
      throw new BadRequestException(
        `Match ${onChainMatchId} is not PENDING (current status: ${matchRecord.status})`,
      );
    }

    // 2. Validate opponent agent
    const opponent = await this.prisma.agent.findUnique({
      where: { id: opponentAgentId },
      select: {
        id: true,
        walletAddress: true,
        encryptedPrivateKey: true,
        tokenAddress: true,
      },
    });

    if (!opponent)
      throw new NotFoundException(`Opponent agent ${opponentAgentId} not found`);
    if (!opponent.walletAddress || !opponent.encryptedPrivateKey || !opponent.tokenAddress)
      throw new BadRequestException(
        `Opponent agent ${opponentAgentId} missing walletAddress, encryptedPrivateKey, or tokenAddress`,
      );

    // 3. Agent B (opponent) — approve USDC + accept challenge via GOAT
    this.logger.log(
      `Accept challenge flow: Agent ${opponentAgentId} accepting challenge ${onChainMatchId}`,
    );

    await this.goatService.executeAgentAction(
      opponentAgentId,
      `You have been challenged to a chess match.
First, approve ${matchRecord.stakeAmount} USDC for the MatchEngine contract at ${matchEngineAddress}.
Then, accept the challenge with matchId ${onChainMatchId}.
Do this now.`,
    );

    // 4. Update Match record (status: ACTIVE)
    await this.prisma.match.update({
      where: { id: matchRecord.id },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(
      `Challenge accepted — starting chess match for on-chain matchId=${onChainMatchId}`,
    );

    // 5. Start chess match
    const { gameId } = await this.startMatch({
      whiteAgentId: challengerAgentId,
      blackAgentId: opponentAgentId,
      multiPv: req.multiPv,
      movetimeMs: req.movetimeMs,
      delayMs: req.delayMs,
      onChainMatchId,
    });

    // Link chess game to match record
    await this.prisma.match.update({
      where: { id: matchRecord.id },
      data: { chessGameId: gameId },
    });

    return {
      matchId: matchRecord.id,
      onChainMatchId,
      gameId,
    };
  }

  /**
   * Get the SSE observable for an active match.
   */
  getMatchStream(gameId: string): Observable<MessageEvent> {
    const subject = this.streams.get(gameId);
    if (!subject) {
      throw new NotFoundException(
        `No active match stream for gameId=${gameId}`,
      );
    }
    return subject.asObservable();
  }

  /**
   * The core match loop. Alternates agent moves until the game is no longer ACTIVE.
   */
  private async runMatchLoop(
    gameId: string,
    whiteAgentId: string,
    blackAgentId: string,
    opts: {
      multiPv?: number;
      movetimeMs?: number;
      delayMs?: number;
      onChainMatchId?: string;
    },
  ): Promise<void> {
    const subject = this.streams.get(gameId);
    if (!subject) return;

    const multiPv = opts.multiPv ?? DEFAULT_MULTI_PV;
    const movetimeMs = opts.movetimeMs ?? DEFAULT_MOVETIME_MS;
    // const delayMs = opts.delayMs ?? DEFAULT_DELAY_MS;

    let halfMoveCount = 0;

    try {
      while (true) {
        const game = await this.chessRulesService.getGame(gameId);

        if (game.status !== GameStatus.ACTIVE) {
          this.logger.log(
            `Match ended gameId=${gameId} status=${game.status} winner=${game.winner ?? 'none'}`,
          );
          break;
        }

        const isWhiteTurn = game.turn === Color.WHITE;
        const currentAgentId = isWhiteTurn ? whiteAgentId : blackAgentId;

        this.logger.log(
          `Half-move #${halfMoveCount + 1} gameId=${gameId} turn=${game.turn} agentId=${currentAgentId}`,
        );

        const result = await this.agentService.makeAgentMove(currentAgentId, {
          gameId,
          multiPv,
          movetimeMs,
        });

        halfMoveCount++;

        const moveNumber = Math.ceil(halfMoveCount / 2);

        // Find the selected candidate to extract eval.
        const selectedCandidate = result.engine.candidates.find(
          (c) => c.uci === result.selectedUci,
        );

        // Normalize eval to white's perspective.
        // Engine scores are from the side-to-move's perspective (before the move).
        // If white moved, score is already from white's POV. If black moved, negate.
        const sign = isWhiteTurn ? 1 : -1;
        const evalCp =
          selectedCandidate?.scoreCp != null
            ? selectedCandidate.scoreCp * sign
            : null;
        const evalMate =
          selectedCandidate?.mate != null
            ? selectedCandidate.mate * sign
            : null;

        const event: MatchMoveEvent = {
          gameId,
          moveNumber,
          fen: result.moveResult.game.fen,
          pgn: result.moveResult.game.pgn,
          san: result.moveResult.move?.san ?? result.selectedUci,
          selectedUci: result.selectedUci,
          turn: result.moveResult.game.turn,
          status: result.moveResult.game.status,
          winner: result.moveResult.game.winner,
          evalCp,
          evalMate,
          agentId: result.agent.id,
          agentName: result.agent.name,
          fallbackUsed: result.fallbackUsed,
        };

        subject.next({ data: event } as MessageEvent);

        if (result.moveResult.game.status !== GameStatus.ACTIVE) {
          this.logger.log(
            `Match ended gameId=${gameId} status=${result.moveResult.game.status} winner=${result.moveResult.game.winner ?? 'none'} halfMoves=${halfMoveCount}`,
          );

          // Attempt on-chain settlement if we have an on-chain match ID
          if (opts.onChainMatchId) {
            await this.settleOnChain(
              opts.onChainMatchId,
              gameId,
              whiteAgentId,
              blackAgentId,
              result.moveResult.game.winner ?? null,
            );
          }

          break;
        }

        // Pause between moves so the frontend can animate.
        // await this.sleep(delayMs);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Match loop error gameId=${gameId}: ${msg}`);
      subject.next({
        data: { error: msg, gameId },
        type: 'error',
      } as MessageEvent);
    } finally {
      subject.complete();
      this.streams.delete(gameId);
      this.logger.log(`Match stream closed gameId=${gameId}`);
    }
  }

  /**
   * Settle an on-chain match after the chess game ends.
   * Maps the chess Winner to the agent's token address and calls MatchEngine.settleMatch.
   */
  private async settleOnChain(
    onChainMatchId: string,
    gameId: string,
    whiteAgentId: string,
    blackAgentId: string,
    winner: Winner | null,
  ): Promise<void> {
    try {
      // Determine the winner token address
      let winnerToken: string;

      if (winner === Winner.DRAW || winner === null) {
        winnerToken = ADDRESS_ZERO;
      } else {
        const winnerAgentId =
          winner === Winner.WHITE ? whiteAgentId : blackAgentId;
        const agent = await this.prisma.agent.findUnique({
          where: { id: winnerAgentId },
          select: { tokenAddress: true },
        });

        if (!agent?.tokenAddress) {
          this.logger.warn(
            `Cannot settle on-chain: winner agent ${winnerAgentId} has no token address`,
          );
          return;
        }
        winnerToken = agent.tokenAddress;
      }

      // Sign the settlement
      const signature = await this.settlementSigner.signSettlement(
        onChainMatchId,
        winnerToken,
      );

      // Send the settlement transaction using the backend signer
      const signerPrivateKey = process.env.RESULT_SIGNER_PRIVATE_KEY;
      if (!signerPrivateKey) {
        this.logger.warn('RESULT_SIGNER_PRIVATE_KEY not set — skipping on-chain settlement');
        return;
      }

      const account = privateKeyToAccount(signerPrivateKey as Hex);
      const transport = http(process.env.RPC_URL ?? 'https://sepolia.base.org');

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport,
      });

      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport,
      });

      const matchEngineAddress = getContractAddresses().MATCH_ENGINE;

      const { request } = await publicClient.simulateContract({
        account,
        address: matchEngineAddress,
        abi: matchEngineAbi,
        functionName: 'settleMatch',
        args: [
          onChainMatchId as Hex,
          winnerToken as `0x${string}`,
          signature as Hex,
        ],
      });

      const txHash = await walletClient.writeContract(request);

      this.logger.log(
        `On-chain settlement submitted matchId=${onChainMatchId} winnerToken=${winnerToken} txHash=${txHash}`,
      );

      // Update the Match record in DB if it exists
      // Note: requires `prisma generate` after schema update to add the Match model
      await (this.prisma as any).match
        ?.update({
          where: { onChainMatchId },
          data: {
            status: 'SETTLED',
            winnerTokenAddress: winnerToken,
            chessGameId: gameId,
            settleTxHash: txHash,
          },
        })
        ?.catch(() => {
          // Match record may not exist yet if not tracked in DB
          this.logger.debug(
            `No Match record found for onChainMatchId=${onChainMatchId} — skipping DB update`,
          );
        });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `On-chain settlement failed matchId=${onChainMatchId}: ${msg}`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
