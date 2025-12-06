-- CreateTable
CREATE TABLE "MomentCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MomentCommentReply" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MomentCommentReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MomentCommentLike_commentId_userId_key" ON "MomentCommentLike"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "MomentCommentLike" ADD CONSTRAINT "MomentCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "MomentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentCommentLike" ADD CONSTRAINT "MomentCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentCommentReply" ADD CONSTRAINT "MomentCommentReply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "MomentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentCommentReply" ADD CONSTRAINT "MomentCommentReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
