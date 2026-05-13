-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('regular', 'combo', 'mini_combo');

-- AlterTable
ALTER TABLE "menu_categories" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'regular';

-- CreateTable
CREATE TABLE "additional_offers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_i18n" JSONB,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "additional_offers_pkey" PRIMARY KEY ("id")
);
