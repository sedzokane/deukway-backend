-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pushToken" TEXT;
