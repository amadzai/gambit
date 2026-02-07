import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MatchMove } from '@/types/marketplace';

/**
 * Props for the move history panel. Expects MatchMove[] from @/types/marketplace.
 */
export interface MoveHistoryPanelProps {
  /** List of moves (MatchMove from @/types/marketplace). */
  moves: MatchMove[];
  /**
   * Half-move index indicating the currently viewed position.
   * 0 = starting position, 1 = after white's 1st move, 2 = after black's 1st, etc.
   */
  currentMoveIndex?: number;
  /** Called when a specific move cell is clicked with its half-move index. */
  onMoveClick?: (halfMoveIndex: number) => void;
  /** Step forward one half-move. */
  onGoForward?: () => void;
  /** Step backward one half-move. */
  onGoBack?: () => void;
}

/**
 * Panel listing move history with evaluations and navigation.
 * Used on the match page. Each white/black cell is clickable for position navigation.
 */
export function MoveHistoryPanel({
  moves,
  currentMoveIndex,
  onMoveClick,
  onGoForward,
  onGoBack,
}: MoveHistoryPanelProps) {
  const activeHalfMove = currentMoveIndex ?? 0;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Move History</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            Move {moves.length > 0 ? moves[moves.length - 1].moveNumber : 0}
          </span>
          <button
            type="button"
            onClick={onGoBack}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Previous move"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onGoForward}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Next move"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {moves.map((move) => {
          const whiteHalfIdx = (move.moveNumber - 1) * 2 + 1;
          const blackHalfIdx = (move.moveNumber - 1) * 2 + 2;
          const isWhiteActive = activeHalfMove === whiteHalfIdx;
          const isBlackActive = activeHalfMove === blackHalfIdx;
          const isRowActive = isWhiteActive || isBlackActive;

          return (
            <div
              key={move.moveNumber}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isRowActive
                  ? 'bg-violet-500/20 border border-violet-500/30'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="w-8 text-center text-sm font-bold text-slate-500">
                {move.moveNumber}.
              </div>
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => onMoveClick?.(whiteHalfIdx)}
                  className={`flex-1 rounded px-3 py-2 text-left transition-colors ${
                    isWhiteActive
                      ? 'bg-violet-500/30 ring-1 ring-violet-500/50'
                      : 'bg-slate-800/50 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="font-mono font-medium text-white">
                    {move.white}
                  </div>
                </button>
                {move.black && (
                  <button
                    type="button"
                    onClick={() => onMoveClick?.(blackHalfIdx)}
                    className={`flex-1 rounded px-3 py-2 text-left transition-colors ${
                      isBlackActive
                        ? 'bg-violet-500/30 ring-1 ring-violet-500/50'
                        : 'bg-slate-800/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="font-mono font-medium text-white">
                      {move.black}
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
