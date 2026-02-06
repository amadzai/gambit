"use client";

import { Chessboard } from "react-chessboard";
import { useState } from "react";

interface LiveChessBoardProps {
  position?: string;
  onMove?: (move: { from: string; to: string }) => void;
  allowDragging?: boolean;
  boardWidth?: number;
}

export function LiveChessBoard({
  position: controlledPosition,
  onMove,
  allowDragging = true,
  boardWidth,
}: LiveChessBoardProps) {
  const [internalPosition] = useState("start");
  const position = controlledPosition ?? internalPosition;

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (onMove) {
      onMove({ from: sourceSquare, to: targetSquare });
    }
    return true;
  };

  return (
    <div
      className="w-full mx-auto"
      style={{ maxWidth: boardWidth ?? 600 }}
    >
      <Chessboard
        position={position}
        arePiecesDraggable={allowDragging}
        onPieceDrop={(sourceSquare, targetSquare) =>
          targetSquare ? onDrop(sourceSquare, targetSquare) : true
        }
        customLightSquareStyle={{
          backgroundColor: "hsl(237, 16.24%, 22.94%)",
        }}
        customDarkSquareStyle={{
          backgroundColor: "hsl(240, 21%, 12%)",
        }}
        boardOrientation="white"
      />
    </div>
  );
}
