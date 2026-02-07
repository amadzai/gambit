"use client";

import { ChessAgent } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { Swords } from "lucide-react";

/**
 * Props for the match header. Expects ChessAgent from @/types/agent.
 */
export interface MatchHeaderProps {
  /** White side agent (ChessAgent from @/types/agent). */
  whiteAgent: ChessAgent;
  /** Black side agent (ChessAgent from @/types/agent). */
  blackAgent: ChessAgent;
  /** Current match status. */
  status: "pending" | "in-progress" | "completed";
  /** Set when status is "completed". */
  winner?: "white" | "black" | "draw";
}

/**
 * Header showing white vs black agent names and match status (pending / in-progress / completed).
 */
export function MatchHeader({ whiteAgent, blackAgent, status, winner }: MatchHeaderProps) {
  const getStatusColor = () => {
    if (status === "completed") {
      if (winner === "draw") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      return "bg-green-500/20 text-green-400 border-green-500/30";
    }
    if (status === "in-progress") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getStatusText = () => {
    if (status === "completed") {
      if (winner === "draw") return "Draw";
      if (winner === "white") return `${whiteAgent.name} Wins!`;
      if (winner === "black") return `${blackAgent.name} Wins!`;
    }
    if (status === "in-progress") return "Battle in Progress...";
    return "Ready to Begin";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-4">
        <h1 className="text-2xl font-bold">{whiteAgent.name}</h1>
        <Swords className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">{blackAgent.name}</h1>
      </div>

      <div className="flex justify-center">
        <Badge variant="outline" className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
    </div>
  );
}
