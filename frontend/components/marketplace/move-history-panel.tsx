import type { MatchMove } from "@/types/marketplace";

/**
 * Props for the move history panel. Expects MatchMove[] from @/types/marketplace.
 */
export interface MoveHistoryPanelProps {
  /** List of moves (MatchMove from @/types/marketplace). */
  moves: MatchMove[];
  /** Optional index to highlight as current (defaults to last move). */
  currentMoveIndex?: number;
}

/**
 * Panel listing move history with evaluations. Used on match page. Uses MatchMove[].
 */
export function MoveHistoryPanel({
  moves,
  currentMoveIndex,
}: MoveHistoryPanelProps) {
  const activeIndex = currentMoveIndex ?? moves.length;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Move History</h3>
        <span className="text-sm text-slate-400">
          Move {moves.length > 0 ? moves[moves.length - 1].moveNumber : 0}
        </span>
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {moves.map((move) => (
          <div
            key={move.moveNumber}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              move.moveNumber === activeIndex
                ? "bg-violet-500/20 border border-violet-500/30"
                : "hover:bg-slate-800/50"
            }`}
          >
            <div className="w-8 text-center text-sm font-bold text-slate-500">
              {move.moveNumber}.
            </div>
            <div className="flex-1 flex gap-2">
              <div className="flex-1 bg-slate-800/50 rounded px-3 py-2">
                <div className="font-mono font-medium text-white">
                  {move.white}
                </div>
              </div>
              {move.black && (
                <div className="flex-1 bg-slate-800/50 rounded px-3 py-2">
                  <div className="font-mono font-medium text-white">
                    {move.black}
                  </div>
                </div>
              )}
            </div>
            <div
              className={`text-xs font-bold w-12 text-right ${
                move.evaluation > 0
                  ? "text-green-400"
                  : move.evaluation < 0
                    ? "text-red-400"
                    : "text-slate-400"
              }`}
            >
              {move.evaluation > 0 ? "+" : ""}
              {move.evaluation.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
