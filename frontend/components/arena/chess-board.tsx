"use client";

import React, { useState } from "react";
import { Chessboard } from "react-chessboard";

/**
 * Props for the interactive chess board. Use for arena or any view that needs
 * FEN position display and optional move handling.
 */
export interface LiveChessBoardProps {
  /** Current board position (FEN or "start" for default). */
  position?: string;
  /** Fallback when position is undefined or "start". Enables per-page defaults. */
  defaultPosition?: string;
  /** Called when user drops a piece. Omit for read-only boards. */
  onMove?: (move: { from: string; to: string }) => void;
  /** Whether pieces can be dragged. Default true. */
  allowDragging?: boolean;
  /** Max width in px. Default 600. */
  boardWidth?: number;
  /** Squares to highlight (e.g. last move from/to). */
  highlightSquares?: { from: string; to: string } | null;
}

/** Standard starting position FEN – use for "start" or as default when no position given. */
export const DEFAULT_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

/**
 * Interactive chess board with optional move handling. Expects FEN positions;
 * use DEFAULT_POSITION or "start" for initial position.
 */
export function LiveChessBoard({
  position: controlledPosition,
  defaultPosition = DEFAULT_POSITION,
  onMove,
  allowDragging = true,
  boardWidth,
  highlightSquares,
}: LiveChessBoardProps) {
  const [internalPosition] = useState(defaultPosition);
  const position = controlledPosition ?? internalPosition;

  const resolvedPosition =
    position === "start" ? defaultPosition : position;

  // Build per-square highlight styles for the last move
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (highlightSquares) {
    const highlightStyle: React.CSSProperties = {
      backgroundColor: "#c49a7c",
    };
    squareStyles[highlightSquares.from] = highlightStyle;
    squareStyles[highlightSquares.to] = highlightStyle;
  }

  const options = {
    position: resolvedPosition,
    allowDragging,
    boardOrientation: "white" as const,
    lightSquareStyle: {
      backgroundColor: "#a67c5e",
    },
    darkSquareStyle: {
      backgroundColor: "#4a3426",
    },
    squareStyles,
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
