-- DropIndex
DROP INDEX "Category_siteId_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_siteId_parentId_slug_key" ON "Category"("siteId", "parentId", "slug");

