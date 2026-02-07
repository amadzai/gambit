"use client";

import { ChessAgent } from "@/types/agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target } from "lucide-react";

/**
 * Props for the arena agent panel. Expects ChessAgent from @/types/agent.
 */
export interface AgentPanelProps {
  /** Agent data (ChessAgent from @/types/agent). */
  agent: ChessAgent;
  /** Side this agent is playing (white or black). */
  color: "white" | "black";
}

/**
 * Displays a single agent's info (name, playstyle, ELO, win rate, record) for arena match view.
 */
export function AgentPanel({ agent, color }: AgentPanelProps) {
  const getPlaystyleColor = (playstyle: string) => {
    const colors = {
      Aggressive: "bg-red-500/20 text-red-400 border-red-500/30",
      Defensive: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Balanced: "bg-green-500/20 text-green-400 border-green-500/30",
      Chaotic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Positional: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[playstyle as keyof typeof colors] || "";
  };

  const totalGames = agent.wins + agent.losses + agent.draws;
  const winRate = totalGames > 0 ? (agent.wins / totalGames) * 100 : 0;

  return (
    <Card className={color === "white" ? "border-white/30" : "border-black/30"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{agent.name}</CardTitle>
          <div className="flex items-center space-x-1 text-sm">
            <div className={`w-4 h-4 rounded-full ${color === "white" ? "bg-white" : "bg-black border border-white"}`} />
            <span className="text-xs text-muted-foreground uppercase">{color}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={getPlaystyleColor(agent.playstyle)}>
            {agent.playstyle}
          </Badge>
          <span className="text-xs text-muted-foreground">First: {agent.firstMove}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span>ELO / Market Cap</span>
            </div>
            <span className="font-bold">{agent.elo}</span>
          </div>
          <Progress value={(agent.elo / 3000) * 100} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4 text-green-500" />
              <span>Win Rate</span>
            </div>
            <span className="font-bold">{winRate.toFixed(1)}%</span>
          </div>
          <Progress value={winRate} className="h-2" />
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-semibold text-muted-foreground">Record</div>
          <div className="flex justify-between text-sm">
            <div className="flex flex-col items-center">
              <span className="text-green-500 font-bold text-lg">{agent.wins}</span>
              <span className="text-xs text-muted-foreground">Wins</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-red-500 font-bold text-lg">{agent.losses}</span>
              <span className="text-xs text-muted-foreground">Losses</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-yellow-500 font-bold text-lg">{agent.draws}</span>
              <span className="text-xs text-muted-foreground">Draws</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <div className="text-xs font-semibold text-muted-foreground">Personality</div>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {agent.personality}
          </p>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <span>Owner: </span>
          <code className="text-xs">{agent.owner}</code>
        </div>
      </CardContent>
    </Card>
  );
}
