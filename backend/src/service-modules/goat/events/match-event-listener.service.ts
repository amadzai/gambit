import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  createPublicClient,
  webSocket,
  type WatchContractEventReturnType,
  type Log,
  AbiEvent,
  Address,
} from 'viem';
import { baseSepolia, getContractAddresses } from '../constants/contracts.js';
import { matchEngineAbi } from '../plugins/gambit/abis/match-engine.abi.js';

type MatchEngineLog = Log<bigint, number, false, AbiEvent, true>;

/**
 * Listens for MatchEngine on-chain events via WebSocket and logs them.
 * Provides event-driven confirmation that on-chain state changes succeeded.
 */
@Injectable()
export class MatchEventListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MatchEventListenerService.name);
  private unwatchFns: WatchContractEventReturnType[] = [];

  onModuleInit() {
    const wssUrl = process.env.WSS_URL;
    if (!wssUrl) {
      this.logger.warn('WSS_URL not set — skipping on-chain event listener');
      return;
    }

    const matchEngineAddress = getContractAddresses().MATCH_ENGINE;
    if (!matchEngineAddress) {
      this.logger.warn(
        'MATCH_ENGINE_ADDRESS not set — skipping event listener',
      );
      return;
    }

    try {
      const client = createPublicClient({
        chain: baseSepolia,
        transport: webSocket(wssUrl),
      });

      const unwatch = client.watchContractEvent({
        address: matchEngineAddress,
        abi: matchEngineAbi,
        pollingInterval: 10_000,
        onLogs: async (logs: MatchEngineLog[]) => {
          this.logger.log(`[MatchEngine] Received ${logs.length} log(s)`);

          for (const log of logs) {
            this.logger.debug({ eventName: log.eventName, log });

            switch (log.eventName) {
              case 'ChallengeCreated':
                await this.handleChallengeCreated(
                  log as Extract<
                    MatchEngineLog,
                    { eventName: 'ChallengeCreated' }
                  >,
                );
                break;
              case 'ChallengeAccepted':
                await this.handleChallengeAccepted(
                  log as Extract<
                    MatchEngineLog,
                    { eventName: 'ChallengeAccepted' }
                  >,
                );
                break;
              case 'MatchSettled':
                await this.handleMatchSettled(
                  log as Extract<MatchEngineLog, { eventName: 'MatchSettled' }>,
                );
                break;
              case 'MatchCancelled':
                await this.handleMatchCancelled(
                  log as Extract<
                    MatchEngineLog,
                    { eventName: 'MatchCancelled' }
                  >,
                );
                break;
            }
          }
        },
        onError: (error) => {
          this.logger.error(
            `[MatchEngine] Error in contract event watcher: ${error.message}`,
            error,
          );
        },
      });

      this.unwatchFns.push(unwatch);
      this.logger.log(
        `Listening for MatchEngine events on ${matchEngineAddress}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start event listener: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  onModuleDestroy() {
    for (const unwatch of this.unwatchFns) {
      unwatch();
    }
    this.unwatchFns = [];
    this.logger.log('MatchEngine event listeners stopped');
  }

  private async handleChallengeCreated(
    log: Extract<MatchEngineLog, { eventName: 'ChallengeCreated' }>,
  ): Promise<void> {
    // TODO: handle ChallengeCreated (e.g. persist match, notify, etc.)
    this.logger.log(
      `[ChallengeCreated] matchId=${String(log.args?.matchId)} ` +
        `agent1=${String(log.args?.agent1Token)} agent2=${String(log.args?.agent2Token)} ` +
        `stake=${String(log.args?.stakeAmount)}`,
    );
  }

  private async handleChallengeAccepted(
    log: Extract<MatchEngineLog, { eventName: 'ChallengeAccepted' }>,
  ): Promise<void> {
    // TODO: handle ChallengeAccepted (e.g. update match state, notify, etc.)
    this.logger.log(
      `[ChallengeAccepted] matchId=${String(log.args?.matchId)} ` +
        `agent2Wallet=${String(log.args?.agent2Wallet)}`,
    );
  }

  private async handleMatchSettled(
    log: Extract<MatchEngineLog, { eventName: 'MatchSettled' }>,
  ): Promise<void> {
    // TODO: handle MatchSettled (e.g. finalize match, transfer stakes, etc.)
    this.logger.log(
      `[MatchSettled] matchId=${String(log.args?.matchId)} ` +
        `winnerToken=${String(log.args?.winnerToken)} totalPot=${String(log.args?.totalPot)}`,
    );
  }

  private async handleMatchCancelled(
    log: Extract<MatchEngineLog, { eventName: 'MatchCancelled' }>,
  ): Promise<void> {
    // TODO: handle MatchCancelled (e.g. update match state, release stakes, etc.)
    this.logger.log(`[MatchCancelled] matchId=${String(log.args.matchId)}`);
  }
}
