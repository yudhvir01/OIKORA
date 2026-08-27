-- DropIndex
DROP INDEX "Product_categoryId_idx";

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_categoryId_name_idx" ON "Product"("categoryId", "name");

-- Trigram search support: lets `ILIKE '%term%'` on name/sku use a GIN
-- index instead of a sequential scan, which matters once the table grows
-- past a few thousand rows.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Product_name_trgm_idx" ON "Product" USING gin (name gin_trgm_ops);

CREATE INDEX "Product_sku_trgm_idx" ON "Product" USING gin (sku gin_trgm_ops);
