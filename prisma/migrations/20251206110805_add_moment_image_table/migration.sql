-- CreateTable
CREATE TABLE "MomentImage" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MomentImage" ADD CONSTRAINT "MomentImage_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
