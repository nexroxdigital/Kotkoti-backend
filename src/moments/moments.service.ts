import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
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
  async createMoment(dto: MomentCreateInput) {
    const { userId, caption, image, video } = dto;

    const result = await this.prisma.moment.create({
      data: {
        userId,
        caption,
        image,
        video,
      },
      //   include: {
      //     user: true,
      //   },
    });

    return result;
  }

  // Get moments with cursor-based pagination + hasMore
  async getMomentsInfinite(lastId?: string, limit = 10) {
    // Prisma query with cursor + skip for infinite scroll
    const queryOptions: Prisma.MomentFindManyArgs = {
      take: limit + 1, // fetch one extra to determine hasMore
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, nickName: true, profilePicture: true } },
        likes: { select: { userId: true } },
        comments: { select: { userId: true } },
      },
      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : 0, // skip the cursor itself
    };

    // Execute query
    const result = await this.prisma.moment.findMany(queryOptions);

    // Use Prisma.MomentGetPayload to get type-safe results with included relations
    type MomentWithRelations = Prisma.MomentGetPayload<{
      include: {
        user: { select: { id: true; nickName: true; profilePicture: true } };
        likes: { select: { userId: true } };
        comments: { select: { userId: true } };
      };
    }>;

    // Cast to type-safe array
    const moments = (result as MomentWithRelations[])
      .slice(0, limit) // slice extra record for hasMore
      .map((m) => ({
        id: m.id,
        caption: m.caption,
        image: m.image,
        video: m.video,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        user: {
          id: m.user.id,
          nickName: m.user.nickName,
          profilePicture: m.user.profilePicture,
        },
        // likes: m.likes,
        // comments: m.comments,
        likesCount: m.likes.length,
        commentsCount: m.comments.length,
      }));

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
      },
    });

    if (!moment) {
      throw new NotFoundException('Moment not found');
    }

    return {
      id: moment.id,
      caption: moment.caption,
      image: moment.image,
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
  async getCommentsInfinite(momentId: string, lastId?: string, limit = 10) {
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
      },

      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : 0,
    };

    // Fetch comments
    const result = await this.prisma.momentComment.findMany(queryOptions);

    // Cast type-safe
    type CommentWithUser = Prisma.MomentCommentGetPayload<{
      include: {
        user: {
          select: { id: true; nickName: true; profilePicture: true };
        };
      };
    }>;

    const comments = (result as CommentWithUser[]).slice(0, limit).map((c) => ({
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
}
