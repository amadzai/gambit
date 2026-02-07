"use client";

import { LiveChessBoard, DEFAULT_POSITION } from "@/components/arena/chess-board";

interface MatchChessBoardProps {
  position?: string;
  /** Fallback when position is undefined or "start". Use for per-page defaults. */
  defaultPosition?: string;
  boardWidth?: number;
  interactive?: boolean;
}

export function MatchChessBoard({
  position = "start",
  defaultPosition = DEFAULT_POSITION,
  boardWidth,
  interactive = false,
}: MatchChessBoardProps) {
  return (
    <LiveChessBoard
      position={position}
      defaultPosition={defaultPosition}
      boardWidth={boardWidth}
      allowDragging={interactive}
    />
  );
}
