-- AlterEnum
-- Remove 'cash' from PaymentMethodType enum
ALTER TYPE "PaymentMethodType" RENAME TO "PaymentMethodType_old";
CREATE TYPE "PaymentMethodType" AS ENUM ('card', 'finik', 'online');
ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE "PaymentMethodType" USING ("payment_method"::text::"PaymentMethodType");
ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE "PaymentMethodType" USING ("payment_method"::text::"PaymentMethodType");
DROP TYPE "PaymentMethodType_old";