"use client";

import { Chessboard } from "react-chessboard";
import { useState } from "react";

interface LiveChessBoardProps {
  /** Current board position (FEN or "start" for default). */
  position?: string;
  /** Fallback when position is undefined or "start". Enables per-page defaults. */
  defaultPosition?: string;
  onMove?: (move: { from: string; to: string }) => void;
  allowDragging?: boolean;
  boardWidth?: number;
}

/** Standard starting position FEN – use for "start" or as default when no position given. */
export const DEFAULT_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

export function LiveChessBoard({
  position: controlledPosition,
  defaultPosition = DEFAULT_POSITION,
  onMove,
  allowDragging = true,
  boardWidth,
}: LiveChessBoardProps) {
  const [internalPosition] = useState(defaultPosition);
  const position = controlledPosition ?? internalPosition;

  const resolvedPosition =
    position === "start" ? defaultPosition : position;

  const options = {
    position: resolvedPosition,
    allowDragging,
    boardOrientation: "white" as const,
    lightSquareStyle: {
      backgroundColor: "hsl(237, 16.24%, 22.94%)",
    },
    darkSquareStyle: {
      backgroundColor: "hsl(240, 21%, 12%)",
    },
    onPieceDrop: ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (onMove && targetSquare) {
        onMove({ from: sourceSquare, to: targetSquare });
      }
      return true;
    },
  };

  return (
    <div
      className="w-full mx-auto"
      style={{ maxWidth: boardWidth ?? 600 }}
    >
      <Chessboard options={options} />
    </div>
  );
}
