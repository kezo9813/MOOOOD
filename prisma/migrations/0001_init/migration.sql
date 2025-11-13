CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Folder" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "name")
);

CREATE TABLE "ImageAsset" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "storageUrl" TEXT NOT NULL,
  "width" DOUBLE PRECISION NOT NULL,
  "height" DOUBLE PRECISION NOT NULL,
  "bytes" INTEGER NOT NULL,
  "mime" TEXT NOT NULL,
  "colorDominant" TEXT,
  "caption" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ImageAsset_userId_createdAt_idx" ON "ImageAsset" ("userId", "createdAt");

CREATE TABLE "Tag" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "name")
);

CREATE INDEX "Tag_userId_idx" ON "Tag" ("userId");

CREATE TABLE "ImageTag" (
  "imageId" INTEGER REFERENCES "ImageAsset"("id") ON DELETE CASCADE,
  "tagId" INTEGER REFERENCES "Tag"("id") ON DELETE CASCADE,
  PRIMARY KEY ("imageId", "tagId")
);

CREATE TABLE "ImageFolder" (
  "imageId" INTEGER REFERENCES "ImageAsset"("id") ON DELETE CASCADE,
  "folderId" INTEGER REFERENCES "Folder"("id") ON DELETE CASCADE,
  PRIMARY KEY ("imageId", "folderId")
);

CREATE TABLE "Embedding" (
  "id" SERIAL PRIMARY KEY,
  "imageId" INTEGER UNIQUE REFERENCES "ImageAsset"("id") ON DELETE CASCADE,
  "vector" vector(1536)
);

CREATE TABLE "Moodboard" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "prompt" TEXT,
  "layoutJson" TEXT NOT NULL,
  "imageIds" INTEGER[],
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Moodboard_userId_createdAt_idx" ON "Moodboard" ("userId", "createdAt");
