/**
 * Hardcoded mapping from the first white SAN move to an opening name.
 * Used in the Match Stats section of the match page.
 */
export const OPENING_NAMES: Record<string, string> = {
  e4: "King's Pawn Opening",
  d4: "Queen's Pawn Opening",
  c4: 'English Opening',
  Nf3: 'Reti Opening',
  g3: "King's Fianchetto Opening",
  b3: "Larsen's Opening",
  f4: "Bird's Opening",
};

export function getOpeningName(firstSan: string | undefined): string {
  if (!firstSan) return 'Unknown';
  return OPENING_NAMES[firstSan] ?? 'Uncommon Opening';
}
