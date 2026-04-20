-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "source" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sourceUrl" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Article_source_idx" ON "Article"("source");
