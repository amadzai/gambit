-- CreateEnum
CREATE TYPE "Color" AS ENUM ('WHITE', 'BLACK');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'CHECKMATE', 'STALEMATE', 'DRAW', 'RESIGNED');

-- CreateTable
CREATE TABLE "ChessGame" (
    "id" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "pgn" TEXT NOT NULL DEFAULT '',
    "turn" "Color" NOT NULL,
    "status" "GameStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChessGame_pkey" PRIMARY KEY ("id")
);
