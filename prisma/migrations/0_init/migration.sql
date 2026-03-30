Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'AUTHOR');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('POST', 'PAGE');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'BOOLEAN', 'DATE', 'URL');

-- CreateEnum
CREATE TYPE "SchedulerStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('DATABASE', 'MEDIA', 'FULL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "slug" VARCHAR(100),
    "title" VARCHAR(150),
    "bio" VARCHAR(500),
    "photo" VARCHAR(500),
    "website" VARCHAR(500),
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Bucharest',
    "language" VARCHAR(5) NOT NULL DEFAULT 'ro',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "template" VARCHAR(50) NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSiteAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "UserSiteAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "contentJson" JSONB NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle" VARCHAR(60),
    "metaDescription" VARCHAR(155),
    "focusKeyword" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageId" TEXT,
    "geoScore" INTEGER,
    "geoBreakdown" JSONB,
    "directAnswer" TEXT,
    "speakableSections" JSONB,
    "schemaMarkup" JSONB,
    "internalLinksUsed" JSONB,
    "revisions" JSONB NOT NULL DEFAULT '[]',
    "categoryId" TEXT,
    "authorId" TEXT NOT NULL,
    "featuredImageId" TEXT,
    "sourceType" TEXT,
    "publisherPageId" TEXT,
    "publisherCampaign" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "schemaMarkup" JSONB,
    "revisions" JSONB NOT NULL DEFAULT '[]',
    "template" VARCHAR(50) NOT NULL DEFAULT 'default',
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "url" TEXT NOT NULL,
    "urlOriginal" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "metaTitle" VARCHAR(60),
    "metaDesc" VARCHAR(155),

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSettings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "defaultMetaTitle" TEXT,
    "defaultMetaDesc" TEXT,
    "defaultOgImage" TEXT,
    "robotsTxt" TEXT,
    "blockAiTrainingBots" BOOLEAN NOT NULL DEFAULT false,
    "googleVerification" TEXT,
    "gscConnected" BOOLEAN NOT NULL DEFAULT false,
    "gscPropertyId" TEXT,
    "sitemapLastBuilt" TIMESTAMP(3),
    "publisherToken" TEXT,
    "notifyEmail" TEXT,
    "notifyOnPublish" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnBackup" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnErrors" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldDefinition" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "postType" "PostType" NOT NULL DEFAULT 'POST',
    "fieldKey" VARCHAR(100) NOT NULL,
    "fieldLabel" VARCHAR(255) NOT NULL,
    "fieldType" "FieldType" NOT NULL,
    "fieldOptions" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "showInSchema" BOOLEAN NOT NULL DEFAULT false,
    "schemaProperty" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldValue" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "pageId" TEXT,
    "fieldDefinitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteScheduleSettings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "maxPerDay" INTEGER NOT NULL DEFAULT 3,
    "preferredTimes" JSONB NOT NULL DEFAULT '["09:00","14:00","18:00"]',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Bucharest',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteScheduleSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerLog" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "status" "SchedulerStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchedulerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "duration" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CWVReport" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "postId" TEXT,
    "url" TEXT NOT NULL,
    "mobile" JSONB NOT NULL,
    "desktop" JSONB NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CWVReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "siteId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "keyHash" VARCHAR(255) NOT NULL,
    "keyPrefix" VARCHAR(12) NOT NULL,
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotFoundLog" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "path" VARCHAR(2048) NOT NULL,
    "referer" VARCHAR(2048),
    "hits" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotFoundLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Site_domain_key" ON "Site"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "UserSiteAccess_userId_siteId_key" ON "UserSiteAccess"("userId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_siteId_slug_key" ON "Category"("siteId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Post_siteId_slug_key" ON "Post"("siteId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Page_siteId_slug_key" ON "Page"("siteId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_siteId_slug_key" ON "Tag"("siteId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_siteId_fromPath_key" ON "Redirect"("siteId", "fromPath");

-- CreateIndex
CREATE UNIQUE INDEX "SeoSettings_siteId_key" ON "SeoSettings"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldValue_postId_fieldDefinitionId_key" ON "FieldValue"("postId", "fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldValue_pageId_fieldDefinitionId_key" ON "FieldValue"("pageId", "fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteScheduleSettings_siteId_key" ON "SiteScheduleSettings"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "NotFoundLog_siteId_path_key" ON "NotFoundLog"("siteId", "path");

-- AddForeignKey
ALTER TABLE "UserSiteAccess" ADD CONSTRAINT "UserSiteAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSiteAccess" ADD CONSTRAINT "UserSiteAccess_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redirect" ADD CONSTRAINT "Redirect_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoSettings" ADD CONSTRAINT "SeoSettings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldDefinition" ADD CONSTRAINT "FieldDefinition_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValue" ADD CONSTRAINT "FieldValue_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValue" ADD CONSTRAINT "FieldValue_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValue" ADD CONSTRAINT "FieldValue_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "FieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteScheduleSettings" ADD CONSTRAINT "SiteScheduleSettings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulerLog" ADD CONSTRAINT "SchedulerLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulerLog" ADD CONSTRAINT "SchedulerLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupLog" ADD CONSTRAINT "BackupLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CWVReport" ADD CONSTRAINT "CWVReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CWVReport" ADD CONSTRAINT "CWVReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotFoundLog" ADD CONSTRAINT "NotFoundLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 7.5.0 -> 7.6.0                        │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

