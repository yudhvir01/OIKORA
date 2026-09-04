-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'STOREKEEPER', 'STAFF');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- AlterTable: organizationId added nullable first; backfilled below, then
-- tightened to NOT NULL once every existing row has a value.
ALTER TABLE "Category" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Location" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Product" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "PurchaseOrderLineItem" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "StockLevel" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "StockTransaction" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "organizationId" TEXT;

-- Data migration: one Default Organization, every existing User attached via
-- Membership (existing ADMIN -> OWNER, existing STAFF -> STAFF), and every
-- existing business-table row backfilled to that org.
INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('default-org', 'Default Organization', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Membership" ("id", "userId", "organizationId", "role", "createdAt", "updatedAt")
SELECT
  'mem_' || "id",
  "id",
  'default-org',
  CASE "role" WHEN 'ADMIN' THEN 'OWNER'::"MembershipRole" ELSE 'STAFF'::"MembershipRole" END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User";

UPDATE "Category" SET "organizationId" = 'default-org';
UPDATE "Location" SET "organizationId" = 'default-org';
UPDATE "Product" SET "organizationId" = 'default-org';
UPDATE "PurchaseOrder" SET "organizationId" = 'default-org';
UPDATE "PurchaseOrderLineItem" SET "organizationId" = 'default-org';
UPDATE "StockLevel" SET "organizationId" = 'default-org';
UPDATE "StockTransaction" SET "organizationId" = 'default-org';
UPDATE "Supplier" SET "organizationId" = 'default-org';

-- AlterTable: tighten to NOT NULL now that every row is backfilled
ALTER TABLE "Category" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Location" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "PurchaseOrderLineItem" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "StockLevel" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "StockTransaction" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "organizationId" SET NOT NULL;

-- DropIndex: old single-column uniques, replaced by org-scoped composites
-- below now that multiple organizations can share the same deployment.
DROP INDEX "Category_name_key";
DROP INDEX "Location_name_key";
DROP INDEX "Product_sku_key";
DROP INDEX "Supplier_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Category_organizationId_idx" ON "Category"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_name_key" ON "Category"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_organizationId_name_key" ON "Location"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organizationId_sku_key" ON "Product"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "PurchaseOrder_organizationId_idx" ON "PurchaseOrder"("organizationId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLineItem_organizationId_idx" ON "PurchaseOrderLineItem"("organizationId");

-- CreateIndex
CREATE INDEX "StockLevel_organizationId_idx" ON "StockLevel"("organizationId");

-- CreateIndex
CREATE INDEX "StockTransaction_organizationId_idx" ON "StockTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_name_key" ON "Supplier"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLineItem" ADD CONSTRAINT "PurchaseOrderLineItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
