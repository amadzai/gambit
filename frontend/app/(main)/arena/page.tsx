"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LiveChessBoard } from "@/components/arena/chess-board";
import { AgentPanel } from "@/components/arena/agent-panel";
import { MatchHeader } from "@/components/arena/match-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockAgents } from "@/lib/mock-data";
import { Play, SkipForward } from "lucide-react";

const DEMO_MOVES = ["e2-e4", "e7-e5", "Ng1-f3", "Nb8-c6"];
const AUTO_PLAY_INTERVAL_MS = 1200;

// Pre-computed FEN for each step of the demo (0 = start, 1 = after e4, … 4 = after all 4 moves)
const DEMO_FENS = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
];

/** Default board position for the arena page (start of demo). */
const ARENA_DEFAULT_POSITION = DEMO_FENS[0];

function ArenaContent() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challenge");

  // For demo, pick two random agents or use the challenged agent
  const whiteAgent = challengeId
    ? mockAgents.find(a => a.id === challengeId) || mockAgents[0]
    : mockAgents[0];
  const blackAgent = mockAgents[1];

  const [status, setStatus] = useState<"pending" | "in-progress" | "completed">("pending");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const boardPosition = useMemo(
    () => DEMO_FENS[Math.min(moveHistory.length, DEMO_FENS.length - 1)],
    [moveHistory.length]
  );

  useEffect(() => {
    if (status !== "in-progress") return;
    let moveIndex = moveHistory.length;
    const interval = setInterval(() => {
      if (moveIndex >= DEMO_MOVES.length) {
        clearInterval(interval);
        return;
      }
      setMoveHistory((prev) => [...prev, DEMO_MOVES[moveIndex]]);
      moveIndex += 1;
    }, AUTO_PLAY_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only start when status becomes in-progress
  }, [status]);

  const handleMove = (move: { from: string; to: string }) => {
    setMoveHistory((prev) => [...prev, `${move.from}-${move.to}`]);
  };

  const startMatch = () => {
    setStatus("in-progress");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <MatchHeader
          whiteAgent={whiteAgent}
          blackAgent={blackAgent}
          status={status}
        />

        <div className="grid gap-6 lg:grid-cols-[300px_1fr_300px]">
          {/* White Agent Panel */}
          <div className="order-2 lg:order-1">
            <AgentPanel agent={whiteAgent} color="white" />
          </div>

          {/* Chessboard */}
          <div className="order-1 lg:order-2 space-y-4">
            <LiveChessBoard
              position={boardPosition}
              defaultPosition={ARENA_DEFAULT_POSITION}
              onMove={handleMove}
            />

            {status === "pending" && (
              <div className="flex justify-center">
                <Button size="lg" onClick={startMatch}>
                  <Play className="mr-2 h-5 w-5" />
                  Start Match
                </Button>
              </div>
            )}

            {status === "in-progress" && (
              <div className="flex justify-center space-x-2">
                <Button variant="outline">
                  <SkipForward className="mr-2 h-4 w-4" />
                  Next Move
                </Button>
                <Button variant="outline">Pause</Button>
              </div>
            )}
          </div>

          {/* Black Agent Panel */}
          <div className="order-3">
            <AgentPanel agent={blackAgent} color="black" />
          </div>
        </div>

        {/* Move History */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Move History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {moveHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No moves yet. Start the match to see the game unfold.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {moveHistory.map((move, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm py-1 px-2 rounded hover:bg-muted"
                      >
                        <span className="text-muted-foreground w-8">
                          {Math.floor(index / 2) + 1}.
                        </span>
                        <span className={index % 2 === 0 ? "text-white" : "text-gray-400"}>
                          {move}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
