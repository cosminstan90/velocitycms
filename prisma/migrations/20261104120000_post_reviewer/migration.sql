-- AlterTable
ALTER TABLE "User" ADD COLUMN     "credentials" VARCHAR(200);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- CreateIndex
CREATE INDEX "Post_reviewedById_idx" ON "Post"("reviewedById");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
