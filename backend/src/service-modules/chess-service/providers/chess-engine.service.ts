import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcess } from 'node:child_process';
import {
  EngineMoveResponse,
  EngineCandidateMove,
} from '../interfaces/chess-engine.interface.js';

const DEFAULT_MULTI_PV = 5;
const DEFAULT_MOVETIME_MS = 200;
const ELO_MIN = 600;
const ELO_MAX = 3000;
const SKILL_LEVEL_MAX = 20;
const UCI_ELO_MIN = 1320;
const UCI_ELO_MAX = 3190;
const ANALYSIS_TIMEOUT_BUFFER_MS = 500;

@Injectable()
export class ChessEngineService implements OnModuleDestroy {
  private readonly logger = new Logger(ChessEngineService.name);
  private process: ChildProcess | null = null;
  private initPromise: Promise<void> | null = null;
  private mutex: Promise<void> = Promise.resolve();

  private static readonly STOCKFISH_CMD = 'stockfish';

  onModuleDestroy(): void {
    this.stopEngine();
  }

  /**
   * Get N candidate moves for the given position and strength.
   * Requests are serialized (one at a time) since we use a single engine process.
   */
  async getCandidateMoves(
    fen: string,
    options: {
      multiPv?: number;
      movetimeMs?: number;
      depth?: number;
      elo?: number;
      skill?: number;
    } = {},
  ): Promise<EngineMoveResponse> {
    const multiPv = Math.min(
      Math.max(1, options.multiPv ?? DEFAULT_MULTI_PV),
      500,
    );
    const movetimeMs = options.movetimeMs ?? DEFAULT_MOVETIME_MS;
    const depth = options.depth;

    return this.withMutex(async () => {
      this.logger.log(
        `getCandidateMoves fen="${fen.slice(0, 30)}…" multiPv=${multiPv} movetimeMs=${movetimeMs} elo=${options.elo ?? '—'} skill=${options.skill ?? '—'}`,
      );
      await this.ensureEngine();
      const timeoutMs =
        (depth ? 60000 : movetimeMs) + ANALYSIS_TIMEOUT_BUFFER_MS;

      const { skillLevel, limitStrength, uciElo } = this.mapStrength(options);

      const commands: string[] = [
        'ucinewgame',
        `setoption name MultiPV value ${multiPv}`,
        `setoption name Skill Level value ${skillLevel}`,
      ];
      if (limitStrength && uciElo != null) {
        commands.push('setoption name UCI_LimitStrength value true');
        commands.push(`setoption name UCI_Elo value ${uciElo}`);
      } else {
        commands.push('setoption name UCI_LimitStrength value false');
      }
      commands.push('isready');
      commands.push(`position fen ${fen}`);
      if (depth != null && depth > 0) {
        commands.push(`go depth ${depth}`);
      } else {
        commands.push(`go movetime ${movetimeMs}`);
      }

      const candidates = await this.sendAndParse(commands, multiPv, timeoutMs);
      this.logger.log(
        `getCandidateMoves returning ${candidates.length} candidate(s)`,
      );
      return { fen, candidates };
    });
  }

  private mapStrength(options: { elo?: number; skill?: number }): {
    skillLevel: number;
    limitStrength: boolean;
    uciElo: number | null;
  } {
    if (options.skill != null) {
      const skillLevel = Math.min(
        Math.max(0, Math.round(options.skill)),
        SKILL_LEVEL_MAX,
      );
      return { skillLevel, limitStrength: false, uciElo: null };
    }
    if (options.elo != null) {
      const elo = Math.min(Math.max(ELO_MIN, Math.round(options.elo)), ELO_MAX);
      const uciElo = Math.min(Math.max(UCI_ELO_MIN, elo), UCI_ELO_MAX);
      return {
        skillLevel: SKILL_LEVEL_MAX,
        limitStrength: true,
        uciElo,
      };
    }
    return { skillLevel: SKILL_LEVEL_MAX, limitStrength: false, uciElo: null };
  }

  private withMutex<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.mutex.then(() => fn());
    this.mutex = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  private ensureEngine(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.startEngine();
    return this.initPromise;
  }

  private startEngine(): Promise<void> {
    this.logger.log('Spawning Stockfish process');
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(ChessEngineService.STOCKFISH_CMD, [], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (err) {
        this.initPromise = null;
        reject(err instanceof Error ? err : new Error(String(err)));
        return;
      }

      const proc = this.process;
      let buffer = '';

      proc.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
      });

      proc.on('error', () => {
        this.onEngineError();
      });
      proc.on('exit', () => {
        this.process = null;
        this.initPromise = null;
      });

      proc.stdin?.write('uci\n');
      const uciHandler = (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        if (buffer.includes('uciok')) {
          proc.stdout?.off('data', uciHandler);
          proc.stdin?.write('isready\n');
          const readyHandler = (c: Buffer) => {
            buffer += c.toString('utf8');
            if (buffer.includes('readyok')) {
              proc.stdout?.off('data', readyHandler);
              resolve();
            }
          };
          proc.stdout?.on('data', readyHandler);
          this.logger.log('Stockfish ready');
        }
      };
      proc.stdout?.on('data', uciHandler);

      setTimeout(() => {
        if (this.initPromise) {
          this.initPromise = null;
          this.stopEngine();
          reject(new Error('Stockfish init timeout'));
        }
      }, 10000);
    });
  }

  private stopEngine(): void {
    if (this.process) {
      this.process.kill('SIGKILL');
      this.process = null;
    }
    this.initPromise = null;
  }

  private onEngineError(): void {
    this.logger.warn('Stockfish process error, stopping engine');
    this.stopEngine();
  }

  private sendAndParse(
    commands: string[],
    multiPv: number,
    timeoutMs: number,
  ): Promise<EngineCandidateMove[]> {
    return new Promise((resolve, reject) => {
      const proc = this.process;
      if (!proc?.stdin || !proc?.stdout) {
        reject(new Error('Engine not running'));
        return;
      }

      const stdin = proc.stdin;
      const stdout = proc.stdout;
      let buffer = '';
      const candidatesByMultipv = new Map<number, EngineCandidateMove>();
      let bestMoveReceived = false;

      const timeout = setTimeout(() => {
        stdout.off('data', dataHandler);
        const sorted = Array.from(candidatesByMultipv.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([, c]) => c);
        resolve(sorted.length > 0 ? sorted : []);
      }, timeoutMs);

      const dataHandler = (chunk: Buffer): void => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('bestmove ')) {
            bestMoveReceived = true;
            continue;
          }
          if (!line.startsWith('info ')) continue;

          const multipvMatch = line.match(/ multipv (\d+)/);
          const depthMatch = line.match(/ depth (\d+)/);
          const scoreCpMatch = line.match(/ score cp (-?\d+)/);
          const scoreMateMatch = line.match(/ score mate (-?\d+)/);
          const pvMatch = line.match(/ pv ([^\n]+)/);

          const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
          const scoreCp = scoreCpMatch
            ? parseInt(scoreCpMatch[1], 10)
            : undefined;
          const mate = scoreMateMatch
            ? parseInt(scoreMateMatch[1], 10)
            : undefined;
          const pv = pvMatch ? pvMatch[1].trim() : undefined;
          const firstMove = pv ? pv.split(/\s+/)[0] : undefined;

          if (firstMove && multipv >= 1 && multipv <= multiPv) {
            candidatesByMultipv.set(multipv, {
              uci: firstMove,
              multipv,
              depth,
              scoreCp,
              mate,
              pv,
            });
          }
        }

        if (bestMoveReceived) {
          clearTimeout(timeout);
          stdout.off('data', dataHandler);
          const sorted = Array.from(candidatesByMultipv.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, c]) => c);
          resolve(sorted);
        }
      };

      stdout.on('data', dataHandler);

      for (const cmd of commands) {
        stdin.write(cmd + '\n');
      }
    });
  }
}
