-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'branch', 'customer');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "SelectionType" AS ENUM ('single', 'multiple');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('pickup', 'delivery');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('cash', 'card', 'finik', 'online');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "username" VARCHAR(100),
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "description" TEXT,
    "logo_url" VARCHAR(500),
    "cover_url" VARCHAR(500),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "city" VARCHAR(100) NOT NULL DEFAULT 'Bishkek',
    "status" "BranchStatus" NOT NULL DEFAULT 'active',
    "temporary_closure_reason" TEXT,
    "temporary_closed_until" TIMESTAMPTZ(6),
    "average_cooking_time" SMALLINT,
    "min_order_amount" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_schedules" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "open_time" TIME(6) NOT NULL,
    "close_time" TIME(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "branch_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_users" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID NOT NULL,

    CONSTRAINT "branch_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "branch_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "name_i18n" JSONB,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "parent_id" UUID,
    "status" "CategoryStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "name_i18n" JSONB,
    "description" TEXT,
    "description_i18n" JSONB,
    "weight_grams" SMALLINT,
    "volume_ml" SMALLINT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "cooking_time_minutes" SMALLINT,
    "calories" SMALLINT,
    "proteins" DECIMAL(6,2),
    "fats" DECIMAL(6,2),
    "carbohydrates" DECIMAL(6,2),
    "ingredients" TEXT,
    "allergens" VARCHAR(500),
    "spicy_level" SMALLINT NOT NULL DEFAULT 0,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_images" (
    "id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_list" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "reason" TEXT,
    "stopped_by" UUID NOT NULL,
    "stopped_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_return_at" TIMESTAMPTZ(6),
    "restored_at" TIMESTAMPTZ(6),
    "restored_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stop_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" UUID NOT NULL,
    "branch_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "name_i18n" JSONB,
    "selection_type" "SelectionType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "min_selections" SMALLINT NOT NULL DEFAULT 0,
    "max_selections" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_options" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_i18n" JSONB,
    "price_delta" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_modifiers" (
    "id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID,
    "customer_name" VARCHAR(200) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "customer_comment" TEXT,
    "order_type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethodType" NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "ready_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "cancelled_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "quantity" SMALLINT NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "item_comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_modifiers" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "modifier_option_id" UUID NOT NULL,
    "price_delta" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_method" "PaymentMethodType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KGS',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "finik_transaction_id" VARCHAR(200),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "polygon_coordinates" JSONB NOT NULL,
    "delivery_fee" DECIMAL(8,2) NOT NULL,
    "min_order_amount" DECIMAL(10,2),
    "estimated_minutes" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(100),
    "address_line" TEXT NOT NULL,
    "apartment" VARCHAR(50),
    "entrance" VARCHAR(20),
    "floor" VARCHAR(10),
    "intercom" VARCHAR(50),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "comment" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "subtitle" TEXT,
    "image_url" VARCHAR(500) NOT NULL,
    "link_target" VARCHAR(500),
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popular_items_stats" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "quantity_sold" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popular_items_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(200) NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "branch_users_branch_id_user_id_key" ON "branch_users"("branch_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_modifiers_menu_item_id_modifier_group_id_key" ON "menu_item_modifiers"("menu_item_id", "modifier_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "popular_items_stats_branch_id_menu_item_id_date_key" ON "popular_items_stats"("branch_id", "menu_item_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "branch_schedules" ADD CONSTRAINT "branch_schedules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_users" ADD CONSTRAINT "branch_users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_users" ADD CONSTRAINT "branch_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_users" ADD CONSTRAINT "branch_users_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_images" ADD CONSTRAINT "menu_item_images_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_list" ADD CONSTRAINT "stop_list_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_list" ADD CONSTRAINT "stop_list_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_list" ADD CONSTRAINT "stop_list_stopped_by_fkey" FOREIGN KEY ("stopped_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_list" ADD CONSTRAINT "stop_list_restored_by_fkey" FOREIGN KEY ("restored_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifiers" ADD CONSTRAINT "menu_item_modifiers_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifiers" ADD CONSTRAINT "menu_item_modifiers_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_option_id_fkey" FOREIGN KEY ("modifier_option_id") REFERENCES "modifier_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popular_items_stats" ADD CONSTRAINT "popular_items_stats_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popular_items_stats" ADD CONSTRAINT "popular_items_stats_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
