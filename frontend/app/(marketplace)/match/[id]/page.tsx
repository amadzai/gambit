"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users, TrendingUp } from "lucide-react";
import { MatchChessBoard } from "@/components/marketplace/match-chess-board";
import { EvaluationBar } from "@/components/marketplace/evaluation-bar";
import { MoveHistoryPanel } from "@/components/marketplace/move-history-panel";
import { mockLiveMatches, mockMatchMoves } from "@/lib/marketplace-mock-data";
import { DEFAULT_POSITION } from "@/components/arena/chess-board";

/** Default board position when no match position is available. */
const MATCH_PAGE_DEFAULT_POSITION = DEFAULT_POSITION;

export default function MatchPage() {
  const params = useParams();
  const id = params.id as string;

  const match = mockLiveMatches.find((m) => m.id === id) ?? mockLiveMatches[0];
  const moves = mockMatchMoves;
  const lastMove = moves[moves.length - 1];
  const currentEvaluation = lastMove.evaluation;
  const currentTurn = lastMove.black ? "white" : "black";

  const [timeElapsed, setTimeElapsed] = useState("");

  useEffect(() => {
    const startTime = Date.now() - 1800000; // 30 min ago
    const updateTime = () => {
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setTimeElapsed(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Marketplace
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-400">LIVE</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{timeElapsed}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4" />
                <span>1,234 watching</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_350px] gap-6">
          {/* Left Column - Evaluation Bar (hidden on mobile) */}
          <div className="hidden lg:block">
            <EvaluationBar evaluation={currentEvaluation} />
          </div>

          {/* Center Column - Chess Board */}
          <div className="space-y-6">
            {/* Black Player Info */}
            <div
              className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
                currentTurn === "black"
                  ? "border-green-500 shadow-lg shadow-green-500/20"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: `${match.black.color}20`,
                      border: `2px solid ${match.black.color}`,
                    }}
                  >
                    {match.black.avatar}
                  </div>
                  <div>
                    <Link
                      href={`/agent/${match.black.id}`}
                      className="font-bold text-white hover:text-green-400 transition-colors"
                    >
                      {match.black.name}
                    </Link>
                    <div className="text-sm text-slate-400">
                      Rating: {match.black.rating}
                    </div>
                  </div>
                </div>
                {currentTurn === "black" && (
                  <div className="flex items-center gap-2 text-green-400 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm font-medium">Thinking...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chess Board */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="max-w-[700px] mx-auto">
                <MatchChessBoard
                  position={match.position}
                  defaultPosition={MATCH_PAGE_DEFAULT_POSITION}
                />
              </div>
            </div>

            {/* White Player Info */}
            <div
              className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
                currentTurn === "white"
                  ? "border-green-500 shadow-lg shadow-green-500/20"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: `${match.white.color}20`,
                      border: `2px solid ${match.white.color}`,
                    }}
                  >
                    {match.white.avatar}
                  </div>
                  <div>
                    <Link
                      href={`/agent/${match.white.id}`}
                      className="font-bold text-white hover:text-violet-400 transition-colors"
                    >
                      {match.white.name}
                    </Link>
                    <div className="text-sm text-slate-400">
                      Rating: {match.white.rating}
                    </div>
                  </div>
                </div>
                {currentTurn === "white" && (
                  <div className="flex items-center gap-2 text-green-400 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm font-medium">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Move History & Stats */}
          <div className="space-y-4">
            <MoveHistoryPanel moves={moves} currentMoveIndex={moves.length} />

            {/* Match Stats */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="font-bold text-white mb-4">Match Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Opening</span>
                  <span className="text-sm font-medium text-white">
                    Ruy Lopez
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Time Control</span>
                  <span className="text-sm font-medium text-white">10+0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Prize Pool</span>
                  <span className="text-sm font-medium text-green-400">
                    $1,250
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-sm text-slate-400">Viewers</span>
                  <span className="text-sm font-medium text-white flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    1,234
                  </span>
                </div>
              </div>
            </div>

            {/* Trading Panel */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                Live Trading
              </h3>
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-400">
                      {match.white.name}
                    </span>
                    <span className="text-sm font-bold text-green-400">
                      +2.3%
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">$2.48</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-400">
                      {match.black.name}
                    </span>
                    <span className="text-sm font-bold text-red-400">
                      -1.8%
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">$1.21</div>
                </div>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all">
                Trade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
