-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('VET', 'TRAINER', 'GROOMER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "county" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "citySlug" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "openingHours" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "plan" VARCHAR(30) NOT NULL DEFAULT 'free',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingService" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,

    CONSTRAINT "ListingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingServiceLink" (
    "listingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ListingServiceLink_pkey" PRIMARY KEY ("listingId","serviceId")
);

-- CreateIndex
CREATE INDEX "Listing_siteId_type_status_citySlug_idx" ON "Listing"("siteId", "type", "status", "citySlug");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_siteId_type_citySlug_slug_key" ON "Listing"("siteId", "type", "citySlug", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ListingService_siteId_type_slug_key" ON "ListingService"("siteId", "type", "slug");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingService" ADD CONSTRAINT "ListingService_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingServiceLink" ADD CONSTRAINT "ListingServiceLink_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingServiceLink" ADD CONSTRAINT "ListingServiceLink_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ListingService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
