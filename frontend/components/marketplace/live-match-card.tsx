"use client";

import Link from "next/link";
import Image from "next/image";
import { MatchChessBoard } from "./match-chess-board";
import type { LiveMatchData } from "@/types/marketplace";
import { DEFAULT_POSITION } from "@/components/arena/chess-board";

/** Default board position for live match cards when position is missing. */
const LIVE_MATCH_CARD_DEFAULT_POSITION = DEFAULT_POSITION;

/**
 * Props for the live match card. Expects LiveMatchData from @/types/marketplace.
 */
export interface LiveMatchCardProps {
  /** Match data (LiveMatchData from @/types/marketplace). */
  match: LiveMatchData;
}

/**
 * Card for a single live match: players, mini board, move count; links to match page. Uses LiveMatchData.
 */
export function LiveMatchCard({ match }: LiveMatchCardProps) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-400">LIVE</span>
        </div>
        <span className="text-sm text-neutral-400">Move {match.move}</span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            {match.white.profileImage ? (
              <Image
                src={match.white.profileImage}
                alt={match.white.name}
                width={64}
                height={64}
                className="w-8 h-8 object-cover"
              />
            ) : (
              <span className="text-xl">{match.white.avatar}</span>
            )}
            <div>
              <div className="font-medium text-white">{match.white.name}</div>
              <div className="text-xs text-neutral-400">
                {match.white.rating}
              </div>
            </div>
          </div>
          <div className="w-4 h-4 rounded-full bg-white" />
        </div>

        <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            {match.black.profileImage ? (
              <Image
                src={match.black.profileImage}
                alt={match.black.name}
                width={32}
                height={32}
                className="w-8 h-8 object-cover"
              />
            ) : (
              <span className="text-xl">{match.black.avatar}</span>
            )}
            <div>
              <div className="font-medium text-white">{match.black.name}</div>
              <div className="text-xs text-neutral-400">
                {match.black.rating}
              </div>
            </div>
          </div>
          <div className="w-4 h-4 rounded-full bg-black" />
        </div>
      </div>

      <div className="mb-4">
        <MatchChessBoard
        position={match.position}
        defaultPosition={LIVE_MATCH_CARD_DEFAULT_POSITION}
        boardWidth={400}
      />
      </div>

      <Link
        href={`/match/${match.id}`}
        className="block w-full mt-4 bg-neutral-800 text-white py-2 rounded-lg hover:bg-neutral-700 transition-colors text-center"
      >
        Watch Match
      </Link>
    </div>
  );
}
