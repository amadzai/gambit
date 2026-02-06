"use client";

import { LiveChessBoard } from "@/components/arena/chess-board";

interface MatchChessBoardProps {
  position?: string;
  boardWidth?: number;
  interactive?: boolean;
}

export function MatchChessBoard({
  position = "start",
  boardWidth,
  interactive = false,
}: MatchChessBoardProps) {
  return (
    <LiveChessBoard
      position={position}
      boardWidth={boardWidth}
      allowDragging={interactive}
    />
  );
}
