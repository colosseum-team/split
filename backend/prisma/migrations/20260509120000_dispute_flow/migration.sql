-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "disputeResolutionDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "Contract" ADD COLUMN     "disputeDueAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DisputeMessage" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "authorWallet" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeAttachment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "messageId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisputeMessage_contractId_createdAt_idx" ON "DisputeMessage"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "DisputeAttachment_contractId_idx" ON "DisputeAttachment"("contractId");

-- CreateIndex
CREATE INDEX "DisputeAttachment_messageId_idx" ON "DisputeAttachment"("messageId");

-- AddForeignKey
ALTER TABLE "DisputeMessage" ADD CONSTRAINT "DisputeMessage_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAttachment" ADD CONSTRAINT "DisputeAttachment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAttachment" ADD CONSTRAINT "DisputeAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DisputeMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
