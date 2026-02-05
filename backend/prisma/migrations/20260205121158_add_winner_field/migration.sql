-- CreateEnum
CREATE TYPE "Winner" AS ENUM ('WHITE', 'BLACK', 'DRAW');

-- AlterTable
ALTER TABLE "ChessGame" ADD COLUMN     "winner" "Winner";
