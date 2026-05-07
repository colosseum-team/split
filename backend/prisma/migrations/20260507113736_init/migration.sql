-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'user');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'open', 'funded', 'in_progress', 'review', 'completed', 'disputed', 'cancelled');

-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('PERFORMER_WON', 'CLIENT_WON', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "AiOutputKind" AS ENUM ('contract_copilot', 'dispute_brief');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nonce" (
    "walletAddress" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nonce_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "deadline" TIMESTAMP(3),
    "customerAddress" TEXT NOT NULL,
    "assigneeAddress" TEXT,
    "contractHash" TEXT,
    "onchainAddress" TEXT,
    "fundTxSignature" TEXT,
    "approveTxSignature" TEXT,
    "resolveTxSignature" TEXT,
    "submissionPayload" TEXT,
    "submissionAt" TIMESTAMP(3),
    "disputeOpenedBy" "Role",
    "disputeOpenedAt" TIMESTAMP(3),
    "disputeOutcome" "DisputeOutcome",
    "disputeResolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiOutput" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "kind" "AiOutputKind" NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "similarityScore" DOUBLE PRECISION,
    "riskScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiOutput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "Nonce_expiresAt_idx" ON "Nonce"("expiresAt");

-- CreateIndex
CREATE INDEX "Contract_customerAddress_idx" ON "Contract"("customerAddress");

-- CreateIndex
CREATE INDEX "Contract_assigneeAddress_idx" ON "Contract"("assigneeAddress");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "AiOutput_contractId_kind_createdAt_idx" ON "AiOutput"("contractId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customerAddress_fkey" FOREIGN KEY ("customerAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_assigneeAddress_fkey" FOREIGN KEY ("assigneeAddress") REFERENCES "User"("walletAddress") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiOutput" ADD CONSTRAINT "AiOutput_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
