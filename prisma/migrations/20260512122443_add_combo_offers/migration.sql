-- CreateTable
CREATE TABLE "combo_offers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "name_i18n" JSONB,
    "description" TEXT,
    "items" JSONB NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "old_price" DECIMAL(10,2),
    "image_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "combo_offers_pkey" PRIMARY KEY ("id")
);
