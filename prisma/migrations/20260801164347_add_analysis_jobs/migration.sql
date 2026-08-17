-- CreateEnum
CREATE TYPE "AnalysisJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "analysisPaused" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AnalysisJob" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "AnalysisJobStatus" NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT NOT NULL,
    "queuePosition" INTEGER,
    "failureReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisJob_storeId_status_idx" ON "AnalysisJob"("storeId", "status");

-- CreateIndex
CREATE INDEX "AnalysisJob_storeId_queuePosition_idx" ON "AnalysisJob"("storeId", "queuePosition");

-- CreateIndex
CREATE INDEX "AnalysisJob_productId_idx" ON "AnalysisJob"("productId");

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
