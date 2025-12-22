-- AlterEnum
ALTER TYPE "EmployeeRole" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "refreshToken" TEXT;
