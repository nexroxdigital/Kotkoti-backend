import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateCommentDto,
  CreateCommentReplyDto,
  UpdateCommentReplyDto,
} from './dto/create-comment.dto';
import { UpdateMomentDto } from './dto/moment.dto';
import { UpdateMomentCommentDto } from './dto/update-moment-comment.dto';
import { MomentCreateInput } from './types/moment.types';

type UserMoment = Prisma.MomentGetPayload<{
  include: {
    likes: { select: { userId: true } };
    comments: { select: { id: true } };
  };
}>;

@Injectable()
export class MomentsService {
  constructor(private readonly prisma: PrismaService) {}

  // create new moment
  async createMoment(
    dto: MomentCreateInput & { files?: Express.Multer.File[] },
  ) {
    const { userId, caption, files, videoFile } = dto;

    // console.log('redeived files', files);

    let videoUrl: string | undefined;
    if (videoFile) {
      videoUrl = `/uploads/moments/videos/${videoFile.filename}`;
    }

    // Create the moment first
    const newMoment = await this.prisma.moment.create({
      data: {
        userId,
        caption,
        video: videoUrl,
      },
    });

    // If no files, return moment only
    if (!files || files.length === 0) {
      return newMoment;
    }

    const momentDir = path.join('uploads', 'moments', newMoment.id);
    if (!fs.existsSync(momentDir)) {
      fs.mkdirSync(momentDir, { recursive: true });
    }

    const imageRecords: { momentId: string; url: string }[] = [];

    for (const file of files) {
      const tempPath = file.path;
      const outputDir = path.join('uploads', 'moments', newMoment.id);

      // ensure folder exists
      if (!fs.existsSync(outputDir))
        fs.mkdirSync(outputDir, { recursive: true });

      const finalFileName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const finalPath = path.join(outputDir, finalFileName);

      // Resize + convert to WebP
      await sharp(tempPath)
        .resize(1080, 1080, { fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(finalPath);

      // delete temp file
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      // Add to DB records
      imageRecords.push({
        momentId: newMoment.id,
        url: `/uploads/moments/${newMoment.id}/${finalFileName}`,
      });
    }

    //  Prepare DB entries for all images
    // const imageRecords = files.map((file) => ({
    //   momentId: newMoment.id,
    //   url: `/uploads/moments/${newMoment.id}/${file.filename}`, // URL to access later
    // }));

    // Insert all images at once
    await this.prisma.momentImage.createMany({
      data: imageRecords,
    });

    const fullMoment = await this.prisma.moment.findUnique({
      where: { id: newMoment.id },
      include: { momentImages: true },
    });

    return fullMoment;
  }

  // Get moments with cursor-based pagination + hasMore
  async getMomentsInfinite(
    lastId?: string,
    limit = 10,
    currentUserId?: string,
  ) {
    // Prisma query with cursor + skip for infinite scroll
    const queryOptions: Prisma.MomentFindManyArgs = {
      take: limit + 1, // fetch one extra to determine hasMore
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
            dob: true,
            charmLevel: {
              select: {
                levelNo: true,
                imageUrl: true,
              },
            },
            wealthLevel: {
              select: {
                levelNo: true,
                imageUrl: true,
              },
            },
          },
        },
        likes: { select: { userId: true } },
        comments: { select: { userId: true } },
        momentImages: true,
        momentShares: true,
      },
      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : 0, // skip the cursor itself
    };

    // Execute query
    const result = await this.prisma.moment.findMany(queryOptions);

    // Use Prisma.MomentGetPayload to get type-safe results with included relations
    type MomentWithRelations = Prisma.MomentGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            nickName: true;
            profilePicture: true;
            dob: true;
            charmLevel: { select: { levelNo: true; imageUrl: true } };
            wealthLevel: { select: { levelNo: true; imageUrl: true } };
          };
        };
        likes: { select: { userId: true } };
        comments: { select: { userId: true } };
        momentImages: true;
        momentShares: true;
      };
    }>;

    // Transform results into API-ready structure
    const moments = await Promise.all(
      (result as MomentWithRelations[])
        .slice(0, limit) // slice extra record for hasMore
        .map(async (m) => ({
          id: m.id,
          caption: m.caption,
          momentImages: m.momentImages.map((i) => i.url),
          video: m.video,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          user: {
            id: m.user.id,
            nickName: m.user.nickName,
            profilePicture: m.user.profilePicture,
            dob: m.user.dob,
            charmLevel: m.user.charmLevel,
            wealthLevel: m.user.wealthLevel,
            isFollowing: currentUserId
              ? !!(await this.prisma.follow.findUnique({
                  where: {
                    userId_followerId: {
                      userId: m.user.id,
                      followerId: currentUserId,
                    },
                  },
                }))
              : false,
          },
          likesCount: m.likes.length, // total likes
          commentsCount: m.comments.length, // total comments
          sharesCount: m.momentShares.length,
          likedByCurrentUser: currentUserId
            ? m.likes.some((like) => like.userId === currentUserId)
            : false, // if current user liked this moment
        })),
    );

    // Determine if there are more moments
    const hasMore = result.length > limit;

    return { data: moments, hasMore };
  }

  // Get one moment by ID
  async getMomentById(momentId: string) {
    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true, // optional
          },
        },
        likes: {
          select: { userId: true },
        },
        comments: {
          select: { id: true },
        },
        momentImages: true,
      },
    });

    if (!moment) {
      throw new NotFoundException('Moment not found');
    }

    return {
      id: moment.id,
      caption: moment.caption,
      momentImages: moment.momentImages.map((i) => i.url),
      video: moment.video,
      createdAt: moment.createdAt,
      updatedAt: moment.updatedAt,
      user: moment.user,
      likes: moment.likes,
      comments: moment.comments,
      likesCount: moment.likes.length,
      commentsCount: moment.comments.length,
    };
  }

  // Get all moments of a user
  async getMomentsByUser(
    userId: string,
    limit = 10,
    lastId?: string,
  ): Promise<{ data: UserMoment[]; hasMore: boolean }> {
    const queryOptions: Prisma.MomentFindManyArgs = {
      take: limit + 1,
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        likes: { select: { userId: true } },
        comments: { select: { id: true } },
      },
      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : 0,
    };

    const result = await this.prisma.moment.findMany(queryOptions);

    const hasMore = result.length > limit;

    const moments: UserMoment[] = result.slice(0, limit) as UserMoment[];

    return { data: moments, hasMore };
  }

  // update moment by user
  async updateMoment(momentId: string, userId: string, dto: UpdateMomentDto) {
    // Check if moment exists
    const existingMoment = await this.prisma.moment.findUnique({
      where: { id: momentId },
    });

    if (!existingMoment) {
      throw new NotFoundException('Moment not found');
    }

    // Check ownership
    if (existingMoment.userId !== userId) {
      throw new ForbiddenException('You cannot update this moment');
    }

    const result = await this.prisma.moment.update({
      where: { id: momentId },
      data: {
        ...dto,
      },
    });

    return result;
  }

  // delete a moment
  async deleteMoment(momentId: string, userId: string) {
    // 1. Check if moment exists
    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
    });

    if (!moment) {
      throw new NotFoundException('Moment not found');
    }

    // 2. Check ownership
    if (moment.userId !== userId) {
      throw new ForbiddenException('You cannot delete this moment');
    }

    // 3. Delete moment (likes + comments auto-delete due to cascade)
    const deleted = await this.prisma.moment.delete({
      where: { id: momentId },
    });

    return {
      message: 'Moment deleted successfully',
      deleted,
    };
  }

  // like a moment
  async likeMoment(momentId: string, userId: string) {
    // Check if moment exists
    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
    });

    if (!moment) {
      throw new NotFoundException('Moment not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.momentLike.findUnique({
      where: {
        momentId_userId: { momentId, userId },
      },
    });

    // ---------- UNLIKE ----------
    if (existingLike) {
      await this.prisma.momentLike.delete({
        where: { id: existingLike.id },
      });

      const likeCount = await this.prisma.momentLike.count({
        where: { momentId },
      });

      return {
        message: 'Moment unliked successfully',
        likeCount,
        liked: false,
      };
    }

    // ---------- LIKE ----------
    const like = await this.prisma.momentLike.create({
      data: {
        momentId,
        userId,
      },
    });

    const likeCount = await this.prisma.momentLike.count({
      where: { momentId },
    });

    return {
      message: 'Moment liked successfully',
      likeCount,
      liked: true,
      like,
    };
  }

  // Add a comment to a moment
  async addComment(momentId: string, userId: string, dto: CreateCommentDto) {
    // ensure required parameters exist server-side
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // verify the target moment exists before creating the comment
    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
      select: { id: true }, // only need to check existence
    });

    // if moment doesn't exist, respond with 404
    if (!moment) {
      throw new NotFoundException('Moment not found');
    }

    // create the comment record
    const comment = await this.prisma.momentComment.create({
      data: {
        momentId,
        userId,
        content: dto.content,
      },
      include: {
        // include the user relation so frontend can show commenter info immediately
        user: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
          },
        },
      },
    });

    // get updated comment count for this moment
    const commentsCount = await this.prisma.momentComment.count({
      where: { momentId },
    });

    // prepare result following your pattern
    const result = {
      message: 'Comment added successfully',
      comment,
      commentsCount,
    };

    return result;
  }

  // update previous comment
  async updateComment(commentId: string, dto: UpdateMomentCommentDto) {
    // first check if comment exists
    const existing = await this.prisma.momentComment.findUnique({
      where: { id: commentId },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    // update comment
    const updatedComment = await this.prisma.momentComment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
      },
    });

    return updatedComment;
  }

  // Get all comments of a moment
  async getCommentsInfinite(
    momentId: string,
    lastId?: string,
    limit = 10,
    currentUserId?: string,
  ) {
    // Infinite scroll with cursor pagination
    const queryOptions: Prisma.MomentCommentFindManyArgs = {
      where: { momentId },

      orderBy: { createdAt: 'desc' },

      take: limit + 1, // fetch extra to detect hasMore

      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
          },
        },
        momentCommentLikes: true,
        momentCommentReplies: {
          include: {
            user: {
              select: {
                id: true,
                nickName: true,
                profilePicture: true,
              },
            },
          },
        },
      },

      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : 0,
    };

    // Fetch comments
    const result = await this.prisma.momentComment.findMany(queryOptions);

    // Cast type-safe
    type CommentWithUserAndLikes = Prisma.MomentCommentGetPayload<{
      include: {
        user: { select: { id: true; nickName: true; profilePicture: true } };
        momentCommentLikes: true;
        momentCommentReplies: {
          include: {
            user: {
              select: {
                id: true;
                nickName: true;
                profilePicture: true;
              };
            };
          };
        };
      };
    }>;

    const comments = (result as CommentWithUserAndLikes[])
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        momentId: c.momentId,
        userId: c.userId,
        content: c.content,
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          nickName: c.user.nickName,
          profilePicture: c.user.profilePicture,
        },
        likeCount: c.momentCommentLikes.length,
        likedByCurrentUser: currentUserId
          ? c.momentCommentLikes.some((like) => like.userId === currentUserId)
          : false,
        repliesCount: c.momentCommentReplies.length,
        replies: c.momentCommentReplies,
      }));

    const hasMore = result.length > limit;

    return { data: comments, hasMore };
  }

  // delete a comment
  async deleteComment(commentId: string, userId: string) {
    // find the comment first
    const comment = await this.prisma.momentComment.findUnique({
      where: { id: commentId },
    });

    // if comment not found → throw error
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // only owner can delete
    if (comment.userId !== userId) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    // delete the comment
    const deletedComment = await this.prisma.momentComment.delete({
      where: { id: commentId },
    });

    // cascade: if reply table exists later with `onDelete: Cascade`, replies auto-delete

    return {
      message: 'Comment deleted successfully',
      deletedComment,
    };
  }

  // like/unlike a comment
  async toggleCommentLike(commentId: string, userId: string) {
    // check if comment exists first
    const comment = await this.prisma.momentComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // check if user already liked the comment
    const existingLike = await this.prisma.momentCommentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });

    if (existingLike) {
      // user already liked → unlike
      await this.prisma.momentCommentLike.delete({
        where: { commentId_userId: { commentId, userId } },
      });

      const likeCount = await this.prisma.momentCommentLike.count({
        where: { commentId },
      });

      return {
        message: 'Comment unliked successfully',
        likeCount,
      };
    } else {
      // user has not liked → create like
      await this.prisma.momentCommentLike.create({
        data: { commentId, userId },
      });

      const likeCount = await this.prisma.momentCommentLike.count({
        where: { commentId },
      });

      return {
        message: 'Comment liked successfully',
        likeCount,
      };
    }
  }

  // add reply to a comment
  async addReply(
    commentId: string,
    userId: string,
    dto: CreateCommentReplyDto,
  ) {
    // Check if parent comment exists
    const comment = await this.prisma.momentComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Parent comment not found');
    }

    // Create the reply
    const reply = await this.prisma.momentCommentReply.create({
      data: {
        commentId,
        userId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, nickName: true, profilePicture: true } },
      },
    });

    return {
      message: 'Reply added successfully',
      reply,
    };
  }

  // update previous reply
  async updateReply(
    replyId: string,
    userId: string,
    dto: UpdateCommentReplyDto,
  ) {
    // Find the reply first
    const reply = await this.prisma.momentCommentReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    // Ensure the logged-in user is the owner of the reply
    if (reply.userId !== userId) {
      throw new ForbiddenException('You are not allowed to update this reply');
    }

    // Update the reply content
    const updatedReply = await this.prisma.momentCommentReply.update({
      where: { id: replyId },
      data: { content: dto.content },
      include: {
        user: { select: { id: true, nickName: true, profilePicture: true } },
      },
    });

    return {
      message: 'Reply updated successfully',
      reply: updatedReply,
    };
  }

  // delete a reply
  async deleteReply(replyId: string, userId: string) {
    // Find the reply first
    const reply = await this.prisma.momentCommentReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    // Ensure the logged-in user is the owner of the reply
    if (reply.userId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this reply');
    }

    // Delete the reply
    await this.prisma.momentCommentReply.delete({
      where: { id: replyId },
    });

    return { message: 'Reply deleted successfully' };
  }

  // get all replies of a comment with infinity scrolling
  async getRepliesInfinite(commentId: string, lastId?: string, limit = 10) {
    // Prisma query with cursor for infinite scrolling
    const queryOptions: Prisma.MomentCommentReplyFindManyArgs = {
      where: { commentId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to detect hasMore
      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
          },
        },
      },
      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : 0, // Skip the cursor itself
    };

    // Fetch replies
    const result = await this.prisma.momentCommentReply.findMany(queryOptions);

    // Cast type-safe
    type ReplyWithUser = Prisma.MomentCommentReplyGetPayload<{
      include: {
        user: { select: { id: true; nickName: true; profilePicture: true } };
      };
    }>;

    const replies = (result as ReplyWithUser[])
      .slice(0, limit) // Slice extra record
      .map((r) => ({
        id: r.id,
        commentId: r.commentId,
        userId: r.userId,
        content: r.content,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
          id: r.user.id,
          nickName: r.user.nickName,
          profilePicture: r.user.profilePicture,
        },
      }));

    // Determine if there are more replies
    const hasMore = result.length > limit;

    return { data: replies, hasMore };
  }
}
