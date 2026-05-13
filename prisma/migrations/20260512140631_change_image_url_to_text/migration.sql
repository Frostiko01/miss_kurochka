-- AlterTable: Change image_url column type from VARCHAR(500) to TEXT in menu_categories
ALTER TABLE "menu_categories" ALTER COLUMN "image_url" TYPE TEXT;

-- AlterTable: Change image_url column type from VARCHAR(500) to TEXT in menu_item_images
ALTER TABLE "menu_item_images" ALTER COLUMN "image_url" TYPE TEXT;
