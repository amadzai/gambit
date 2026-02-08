/**
 * Props for the evaluation bar. Evaluation is typically in centipawns (e.g. -10 to +10).
 */
export interface EvaluationBarProps {
  /** Engine evaluation (positive = white advantage). */
  evaluation: number;
}

/**
 * Vertical bar showing current position evaluation (white vs black advantage). Used on match page.
 */
export function EvaluationBar({ evaluation }: EvaluationBarProps) {
  // evaluation range typically -10 to +10, map to 0-100
  const normalized = (evaluation + 10) / 20;
  const whiteAdvantage = Math.max(0, Math.min(100, normalized * 100));

  return (
    <div className="border border-white rounded-md p-2">
      <div className="relative h-[830px] rounded-md overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 bg-neutral-950 transition-all duration-500"
          style={{ height: `${100 - whiteAdvantage}%` }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 bg-neutral-100 transition-all duration-500"
          style={{ height: `${whiteAdvantage}%` }}
        />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-600 -translate-y-1/2" />
        <div
          className="absolute left-1/2 transition-all duration-500"
          style={{
            top: `${100 - whiteAdvantage}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-xs font-bold text-white whitespace-nowrap">
            {evaluation > 0 ? '+' : ''}
            {evaluation.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
