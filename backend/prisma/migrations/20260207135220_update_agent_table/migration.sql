-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "encryptedPrivateKey" TEXT,
ADD COLUMN     "tokenAddress" TEXT,
ADD COLUMN     "walletAddress" TEXT;
