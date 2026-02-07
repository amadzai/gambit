import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createPublicClient, webSocket, type WatchContractEventReturnType } from 'viem';
import { baseSepolia, getContractAddresses } from '../constants/contracts.js';
import { matchEngineAbi } from '../plugins/gambit/abis/match-engine.abi.js';

/**
 * Listens for MatchEngine on-chain events via WebSocket and logs them.
 * Provides event-driven confirmation that on-chain state changes succeeded.
 */
@Injectable()
export class MatchEventListenerService implements OnModuleInit, OnModuleDestroy {
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
      this.logger.warn('MATCH_ENGINE_ADDRESS not set — skipping event listener');
      return;
    }

    try {
      const client = createPublicClient({
        chain: baseSepolia,
        transport: webSocket(wssUrl),
      });

      const unwatch1 = client.watchContractEvent({
        address: matchEngineAddress,
        abi: matchEngineAbi,
        eventName: 'ChallengeCreated',
        onLogs: (logs) => {
          for (const log of logs) {
            this.logger.log(
              `[ChallengeCreated] matchId=${String(log.args.matchId)} ` +
                `agent1=${String(log.args.agent1Token)} agent2=${String(log.args.agent2Token)} ` +
                `stake=${String(log.args.stakeAmount)}`,
            );
          }
        },
        onError: (error) => {
          this.logger.error(`ChallengeCreated listener error: ${error.message}`);
        },
      });

      const unwatch2 = client.watchContractEvent({
        address: matchEngineAddress,
        abi: matchEngineAbi,
        eventName: 'ChallengeAccepted',
        onLogs: (logs) => {
          for (const log of logs) {
            this.logger.log(
              `[ChallengeAccepted] matchId=${String(log.args.matchId)} ` +
                `agent2Wallet=${String(log.args.agent2Wallet)}`,
            );
          }
        },
        onError: (error) => {
          this.logger.error(`ChallengeAccepted listener error: ${error.message}`);
        },
      });

      const unwatch3 = client.watchContractEvent({
        address: matchEngineAddress,
        abi: matchEngineAbi,
        eventName: 'MatchSettled',
        onLogs: (logs) => {
          for (const log of logs) {
            this.logger.log(
              `[MatchSettled] matchId=${String(log.args.matchId)} ` +
                `winnerToken=${String(log.args.winnerToken)} totalPot=${String(log.args.totalPot)}`,
            );
          }
        },
        onError: (error) => {
          this.logger.error(`MatchSettled listener error: ${error.message}`);
        },
      });

      const unwatch4 = client.watchContractEvent({
        address: matchEngineAddress,
        abi: matchEngineAbi,
        eventName: 'MatchCancelled',
        onLogs: (logs) => {
          for (const log of logs) {
            this.logger.log(
              `[MatchCancelled] matchId=${String(log.args.matchId)}`,
            );
          }
        },
        onError: (error) => {
          this.logger.error(`MatchCancelled listener error: ${error.message}`);
        },
      });

      this.unwatchFns.push(unwatch1, unwatch2, unwatch3, unwatch4);
      this.logger.log(`Listening for MatchEngine events on ${matchEngineAddress}`);
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
}
