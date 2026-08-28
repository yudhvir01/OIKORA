-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "locationId" TEXT;

-- CreateIndex
CREATE INDEX "PurchaseOrder_locationId_idx" ON "PurchaseOrder"("locationId");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
