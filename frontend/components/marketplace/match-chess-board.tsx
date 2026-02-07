"use client";

import { LiveChessBoard, DEFAULT_POSITION } from "@/components/arena/chess-board";

/**
 * Props for the match chess board (read-only or interactive). Wraps LiveChessBoard with match defaults.
 */
export interface MatchChessBoardProps {
  /** Current FEN or "start". */
  position?: string;
  /** Fallback when position is undefined or "start". Use for per-page defaults. */
  defaultPosition?: string;
  /** Max board width in px. */
  boardWidth?: number;
  /** If true, pieces can be dragged. Default false (read-only). */
  interactive?: boolean;
  /** Squares to highlight (e.g. last move from/to). */
  highlightSquares?: { from: string; to: string } | null;
}

/**
 * Chess board for match/marketplace views. Read-only by default; set interactive for moves. Uses DEFAULT_POSITION from arena/chess-board.
 */
export function MatchChessBoard({
  position = "start",
  defaultPosition = DEFAULT_POSITION,
  boardWidth,
  interactive = false,
  highlightSquares,
}: MatchChessBoardProps) {
  return (
    <LiveChessBoard
      position={position}
      defaultPosition={defaultPosition}
      boardWidth={boardWidth}
      allowDragging={interactive}
      highlightSquares={highlightSquares}
    />
  );
}
