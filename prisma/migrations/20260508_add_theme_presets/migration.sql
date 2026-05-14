-- AlterTable
ALTER TABLE "Theme" ADD COLUMN "presetId" TEXT;

-- CreateTable
CREATE TABLE "ThemePreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "colors" JSONB NOT NULL DEFAULT '{}',
    "typography" JSONB NOT NULL DEFAULT '{}',
    "radius" JSONB NOT NULL DEFAULT '{}',
    "shadows" JSONB NOT NULL DEFAULT '{}',
    "builtIn" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemePreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThemePreset_name_key" ON "ThemePreset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ThemePreset_slug_key" ON "ThemePreset"("slug");

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "ThemePreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
