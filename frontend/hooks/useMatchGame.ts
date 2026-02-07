'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { apiService } from '@/utils/apiService';
import type { ChessGame } from '@/types/chess';
import type { Agent } from '@/types/agent';
import type { MatchMoveEvent } from '@/types/match';
import type { MatchMove } from '@/types/marketplace';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** A single half-move with position data for board navigation. */
interface HalfMove {
  san: string;
  fen: string;
  /** Square the piece moved from (e.g. "e2"). */
  from: string;
  /** Square the piece moved to (e.g. "e4"). */
  to: string;
  /** Full-move number (1-based, same for white & black of the same turn). */
  moveNumber: number;
  color: 'white' | 'black';
  /** Centipawn eval from white's perspective. Null if unavailable. */
  evalCp: number | null;
  /** Mate-in-N from white's perspective. Null if not a mate line. */
  evalMate: number | null;
  agentId?: string;
  agentName?: string;
}

// ---------------------------------------------------------------------------
// Public hook result
// ---------------------------------------------------------------------------

export interface UseMatchGameResult {
  /** Current game data from the backend. */
  game: ChessGame | null;
  /** White-side agent info. */
  whiteAgent: Agent | null;
  /** Black-side agent info. */
  blackAgent: Agent | null;
  /** Whether the game is currently active (live). */
  isLive: boolean;
  /** Loading state for the initial data fetch. */
  isLoading: boolean;
  /** Error from fetching or SSE. */
  error: Error | null;
  /** Grouped moves for MoveHistoryPanel display. */
  moves: MatchMove[];
  /** Current half-move index (0 = starting position, 1 = after white's 1st move, …). */
  currentHalfMoveIndex: number;
  /** FEN for the currently viewed board position. */
  boardFen: string;
  /** Evaluation at the current position (pawn units, clamped -10 to +10). */
  currentEvaluation: number;
  /** The from/to squares of the currently viewed move, for board highlighting. Null at starting position. */
  lastMoveSquares: { from: string; to: string } | null;
  /** True when viewing the latest move (controls live auto-advance). */
  isAtLatest: boolean;
  /** Jump to a specific half-move index. */
  goToHalfMove: (index: number) => void;
  /** Step forward one half-move. */
  goForward: () => void;
  /** Step backward one half-move. */
  goBack: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replay a PGN string move-by-move and return one HalfMove per ply.
 * Eval data is not available from PGN so evalCp / evalMate are null.
 */
function parsePgnToHalfMoves(pgn: string): HalfMove[] {
  if (!pgn || !pgn.trim()) return [];

  const loader = new Chess();
  try {
    loader.loadPgn(pgn);
  } catch {
    return [];
  }
  const sanMoves = loader.history();

  const replayer = new Chess();
  const halfMoves: HalfMove[] = [];

  for (let i = 0; i < sanMoves.length; i++) {
    const result = replayer.move(sanMoves[i]);
    halfMoves.push({
      san: sanMoves[i],
      fen: replayer.fen(),
      from: result.from,
      to: result.to,
      moveNumber: Math.floor(i / 2) + 1,
      color: i % 2 === 0 ? 'white' : 'black',
      evalCp: null,
      evalMate: null,
    });
  }

  return halfMoves;
}

/**
 * Group half-moves into pairs for the MoveHistoryPanel (one row per full move).
 */
function groupHalfMovesIntoMatchMoves(halfMoves: HalfMove[]): MatchMove[] {
  const grouped: MatchMove[] = [];

  for (let i = 0; i < halfMoves.length; i += 2) {
    const white = halfMoves[i];
    const black = halfMoves[i + 1];
    // Use the latest eval in the pair for display (convert cp → pawn units)
    const rawEval = black?.evalCp ?? white.evalCp ?? 0;
    grouped.push({
      moveNumber: white.moveNumber,
      white: white.san,
      black: black?.san,
      evaluation: rawEval / 100,
    });
  }

  return grouped;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMatchGame(gameId: string | null): UseMatchGameResult {
  const [game, setGame] = useState<ChessGame | null>(null);
  const [whiteAgent, setWhiteAgent] = useState<Agent | null>(null);
  const [blackAgent, setBlackAgent] = useState<Agent | null>(null);
  const [halfMoves, setHalfMoves] = useState<HalfMove[]>([]);
  const [currentHalfMoveIndex, setCurrentHalfMoveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /** Set to true once initial fetch completes and game is ACTIVE. */
  const [sseReady, setSseReady] = useState(false);

  /** Tracks whether the user is viewing the latest move (for auto-advance). */
  const isAtLatestRef = useRef(true);

  const eventSourceRef = useRef<EventSource | null>(null);

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------

  const isLive = game?.status === 'ACTIVE';
  const isAtLatest = isAtLatestRef.current;

  const boardFen = useMemo(() => {
    if (currentHalfMoveIndex === 0) return STARTING_FEN;
    return halfMoves[currentHalfMoveIndex - 1]?.fen ?? STARTING_FEN;
  }, [currentHalfMoveIndex, halfMoves]);

  /** The from/to squares of the currently viewed move, for board highlighting. */
  const lastMoveSquares = useMemo<{ from: string; to: string } | null>(() => {
    if (currentHalfMoveIndex === 0) return null;
    const hm = halfMoves[currentHalfMoveIndex - 1];
    if (!hm) return null;
    return { from: hm.from, to: hm.to };
  }, [currentHalfMoveIndex, halfMoves]);

  const currentEvaluation = useMemo(() => {
    if (currentHalfMoveIndex === 0) return 0;
    const hm = halfMoves[currentHalfMoveIndex - 1];
    if (!hm) return 0;
    if (hm.evalMate != null) return hm.evalMate > 0 ? 10 : -10;
    if (hm.evalCp != null) return Math.max(-10, Math.min(10, hm.evalCp / 100));
    return 0;
  }, [currentHalfMoveIndex, halfMoves]);

  const moves = useMemo(
    () => groupHalfMovesIntoMatchMoves(halfMoves),
    [halfMoves],
  );

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  const goToHalfMove = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, halfMoves.length));
      setCurrentHalfMoveIndex(clamped);
      isAtLatestRef.current = clamped === halfMoves.length;
    },
    [halfMoves.length],
  );

  const goForward = useCallback(() => {
    setCurrentHalfMoveIndex((prev) => {
      const next = Math.min(prev + 1, halfMoves.length);
      isAtLatestRef.current = next === halfMoves.length;
      return next;
    });
  }, [halfMoves.length]);

  const goBack = useCallback(() => {
    setCurrentHalfMoveIndex((prev) => {
      const next = Math.max(0, prev - 1);
      isAtLatestRef.current = next === halfMoves.length;
      return next;
    });
  }, [halfMoves.length]);

  // -----------------------------------------------------------------------
  // Fetch game + agents on mount / gameId change
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setWhiteAgent(null);
      setBlackAgent(null);
      setHalfMoves([]);
      setCurrentHalfMoveIndex(0);
      setIsLoading(false);
      setError(null);
      setSseReady(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setSseReady(false);

      try {
        // 1. Fetch game
        const gameData = await apiService.chess.getGameById(gameId);
        if (cancelled) return;
        setGame(gameData);

        // 2. Parse existing PGN
        const initial = parsePgnToHalfMoves(gameData.pgn);
        setHalfMoves(initial);
        setCurrentHalfMoveIndex(initial.length);
        isAtLatestRef.current = true;

        // 3. Fetch both agents in parallel
        const [white, black] = await Promise.all([
          apiService.agent.getById(gameData.whiteAgentId),
          apiService.agent.getById(gameData.blackAgentId),
        ]);
        if (cancelled) return;
        setWhiteAgent(white);
        setBlackAgent(black);

        // 4. If game is live, enable SSE
        if (gameData.status === 'ACTIVE') {
          setSseReady(true);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  // -----------------------------------------------------------------------
  // SSE subscription for live matches
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!gameId || !sseReady) return;

    const es = apiService.match.stream(gameId);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const moveEvent: MatchMoveEvent = JSON.parse(event.data);

        // turn AFTER the move tells us who played:
        //   turn=BLACK → white just moved, turn=WHITE → black just moved
        const color: 'white' | 'black' =
          moveEvent.turn === 'BLACK' ? 'white' : 'black';

        // Extract from/to squares from UCI notation (e.g. "g1f3" → from="g1", to="f3")
        const uciFrom = moveEvent.selectedUci.slice(0, 2);
        const uciTo = moveEvent.selectedUci.slice(2, 4);

        const newHalfMove: HalfMove = {
          san: moveEvent.san,
          fen: moveEvent.fen,
          from: uciFrom,
          to: uciTo,
          moveNumber: moveEvent.moveNumber,
          color,
          evalCp: moveEvent.evalCp,
          evalMate: moveEvent.evalMate,
          agentId: moveEvent.agentId,
          agentName: moveEvent.agentName,
        };

        // Expected 0-based array index for this half-move
        const arrayIndex =
          color === 'white'
            ? (moveEvent.moveNumber - 1) * 2
            : (moveEvent.moveNumber - 1) * 2 + 1;

        setHalfMoves((prev) => {
          // Skip if we already have this move (from PGN parsing on initial load)
          if (arrayIndex < prev.length) return prev;
          return [...prev, newHalfMove];
        });

        // Auto-advance if user is viewing the latest position
        if (isAtLatestRef.current) {
          setCurrentHalfMoveIndex(arrayIndex + 1);
        }

        // Mirror relevant fields back into game state
        setGame((prev) =>
          prev
            ? {
                ...prev,
                fen: moveEvent.fen,
                pgn: moveEvent.pgn,
                turn: moveEvent.turn,
                status: moveEvent.status,
                winner: moveEvent.winner ?? prev.winner,
              }
            : prev,
        );

        // If game ended, close the stream
        if (moveEvent.status !== 'ACTIVE') {
          es.close();
        }
      } catch {
        // Ignore non-JSON messages (e.g. heartbeat or error frames)
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [gameId, sseReady]);

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  return {
    game,
    whiteAgent,
    blackAgent,
    isLive,
    isLoading,
    error,
    moves,
    currentHalfMoveIndex,
    boardFen,
    currentEvaluation,
    lastMoveSquares,
    isAtLatest,
    goToHalfMove,
    goForward,
    goBack,
  };
}
