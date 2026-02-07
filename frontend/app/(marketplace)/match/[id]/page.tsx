'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { MarketplaceNav } from '@/components/marketplace/marketplace-nav';
import { MatchChessBoard } from '@/components/marketplace/match-chess-board';
import { EvaluationBar } from '@/components/marketplace/evaluation-bar';
import { MoveHistoryPanel } from '@/components/marketplace/move-history-panel';
import { useMatchGame } from '@/hooks';
import { getOpeningName } from '@/lib/opening-names';
import { DEFAULT_POSITION } from '@/components/arena/chess-board';

/** Default board position when no match position is available. */
const MATCH_PAGE_DEFAULT_POSITION = DEFAULT_POSITION;

/** Fallback avatar/color for the white-side agent. */
const WHITE_AVATAR = '♔';
const WHITE_COLOR = '#8B5CF6';

/** Fallback avatar/color for the black-side agent. */
const BLACK_AVATAR = '♚';
const BLACK_COLOR = '#EC4899';

export default function MatchPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    game,
    whiteAgent,
    blackAgent,
    isLive,
    isLoading,
    error,
    moves,
    currentHalfMoveIndex,
    boardFen,
    currentEvaluation,
    lastMoveSquares,
    isAtLatest,
    goToHalfMove,
    goForward,
    goBack,
  } = useMatchGame(id);

  const currentTurn =
    game?.turn === 'WHITE' ? 'white' : game?.turn === 'BLACK' ? 'black' : null;

  // Only show the "Thinking…" indicator when live and viewing the latest move
  const showThinking = isLive && isAtLatest;

  // Match outcome display
  const matchOutcome = (() => {
    if (!game || game.status === 'ACTIVE') return '-';
    if (game.winner === 'WHITE') return 'White';
    if (game.winner === 'BLACK') return 'Black';
    if (game.winner === 'DRAW') return 'Draw';
    return game.status.charAt(0) + game.status.slice(1).toLowerCase();
  })();

  // Opening name from first white move
  const openingName = getOpeningName(moves[0]?.white);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <MarketplaceNav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={`grid grid-cols-1 gap-6 ${isLive ? 'lg:grid-cols-[60px_1fr_320px]' : 'lg:grid-cols-[1fr_320px]'}`}>
          {/* Left Column - Evaluation Bar (live matches only, hidden on mobile) */}
          {isLive && (
            <div className="hidden lg:block">
              <EvaluationBar evaluation={currentEvaluation} />
            </div>
          )}

          {/* Center Column - Chess Board */}
          <div className="space-y-6">
            {/* Black Player Info */}
            <div
              className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
                showThinking && currentTurn === 'black'
                  ? 'border-green-500 shadow-lg shadow-green-500/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {blackAgent?.profileImage ? (
                    <Image
                      src={blackAgent.profileImage}
                      alt={blackAgent.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-md object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-md flex items-center justify-center text-2xl"
                      style={{ background: `${BLACK_COLOR}20` }}
                    >
                      {BLACK_AVATAR}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/agent/${blackAgent?.id ?? ''}`}
                      className="font-bold text-white hover:text-green-400 transition-colors"
                    >
                      {blackAgent?.name ?? 'Loading…'}
                    </Link>
                    <div className="text-sm text-slate-400">
                      Rating: {blackAgent?.elo ?? '—'}
                    </div>
                  </div>
                </div>
                {showThinking && currentTurn === 'black' && (
                  <div className="flex items-center gap-2 text-green-400 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm font-medium">Thinking...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chess Board */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[400px] text-slate-400">
                    Loading game…
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-[400px] text-red-400">
                    Failed to load game
                  </div>
                ) : (
                  <MatchChessBoard
                    position={boardFen}
                    defaultPosition={MATCH_PAGE_DEFAULT_POSITION}
                    highlightSquares={lastMoveSquares}
                  />
                )}
              </div>
            </div>

            {/* White Player Info */}
            <div
              className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
                showThinking && currentTurn === 'white'
                  ? 'border-green-500 shadow-lg shadow-green-500/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {whiteAgent?.profileImage ? (
                    <Image
                      src={whiteAgent.profileImage}
                      alt={whiteAgent.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-md object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-md flex items-center justify-center text-2xl"
                      style={{ background: `${WHITE_COLOR}20` }}
                    >
                      {WHITE_AVATAR}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/agent/${whiteAgent?.id ?? ''}`}
                      className="font-bold text-white hover:text-violet-400 transition-colors"
                    >
                      {whiteAgent?.name ?? 'Loading…'}
                    </Link>
                    <div className="text-sm text-slate-400">
                      Rating: {whiteAgent?.elo ?? '—'}
                    </div>
                  </div>
                </div>
                {showThinking && currentTurn === 'white' && (
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
            <MoveHistoryPanel
              moves={moves}
              currentMoveIndex={currentHalfMoveIndex}
              onMoveClick={goToHalfMove}
              onGoForward={goForward}
              onGoBack={goBack}
            />

            {/* Match Stats */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="font-bold text-white mb-4">Match Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Opening</span>
                  <span className="text-sm font-medium text-white">
                    {openingName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Match Date</span>
                  {isLive ? (
                    <span className="text-sm font-medium text-red-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {game?.createdAt
                        ? format(new Date(game.createdAt), 'MMM d, yyyy')
                        : '—'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Match Outcome</span>
                  <span className="text-sm font-medium text-white">
                    {matchOutcome}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-sm text-slate-400">Viewers</span>
                  <span className="text-sm font-medium text-white flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    121
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
                      {whiteAgent?.name ?? 'White'}
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
                      {blackAgent?.name ?? 'Black'}
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
