-- CreateEnum
CREATE TYPE "OnChainMatchStatus" AS ENUM ('PENDING', 'ACTIVE', 'SETTLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "onChainMatchId" TEXT NOT NULL,
    "agent1TokenAddress" TEXT NOT NULL,
    "agent2TokenAddress" TEXT NOT NULL,
    "stakeAmount" TEXT NOT NULL,
    "status" "OnChainMatchStatus" NOT NULL DEFAULT 'PENDING',
    "winnerTokenAddress" TEXT,
    "chessGameId" TEXT,
    "settleTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_onChainMatchId_key" ON "Match"("onChainMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_chessGameId_key" ON "Match"("chessGameId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_chessGameId_fkey" FOREIGN KEY ("chessGameId") REFERENCES "ChessGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
