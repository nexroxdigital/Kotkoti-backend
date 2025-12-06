-- CreateTable
CREATE TABLE "Svip" (
    "id" SERIAL NOT NULL,
    "levelName" TEXT NOT NULL,
    "levelNo" TEXT NOT NULL,
    "needPoint" INTEGER NOT NULL,
    "expireDuration" INTEGER NOT NULL,
    "img" TEXT,

    CONSTRAINT "Svip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SvipPowerPrivilege" (
    "id" SERIAL NOT NULL,
    "svipId" INTEGER NOT NULL,
    "powerName" TEXT NOT NULL,

    CONSTRAINT "SvipPowerPrivilege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SvipMediaPrivilege" (
    "id" SERIAL NOT NULL,
    "svipId" INTEGER NOT NULL,
    "swf" TEXT,
    "swftime" TEXT,

    CONSTRAINT "SvipMediaPrivilege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SvipLog" (
    "id" SERIAL NOT NULL,
    "svipId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SvipLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SvipPowerPrivilege" ADD CONSTRAINT "SvipPowerPrivilege_svipId_fkey" FOREIGN KEY ("svipId") REFERENCES "Svip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SvipMediaPrivilege" ADD CONSTRAINT "SvipMediaPrivilege_svipId_fkey" FOREIGN KEY ("svipId") REFERENCES "Svip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SvipLog" ADD CONSTRAINT "SvipLog_svipId_fkey" FOREIGN KEY ("svipId") REFERENCES "Svip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SvipLog" ADD CONSTRAINT "SvipLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
