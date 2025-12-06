import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { momentFilesInterceptorConfig } from 'src/common/multer.config';
import {
  CreateCommentDto,
  CreateCommentReplyDto,
  UpdateCommentReplyDto,
} from './dto/create-comment.dto';
import { CreateMomentDto, UpdateMomentDto } from './dto/moment.dto';
import { UpdateMomentCommentDto } from './dto/update-moment-comment.dto';
import { MomentsService } from './moments.service';

export interface RequestWithUser extends Request {
  user: User;
}

// create new moment
@Controller('moment')
@UseGuards(JwtAuthGuard)
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Post('create')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'video', maxCount: 1 },
      ],
      momentFilesInterceptorConfig,
    ),
  )
  async createMoment(
    @Req() req: RequestWithUser,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
    @Body() dto: CreateMomentDto,
  ) {
    const userId = (req.user as any)?.userId;

    const images = files.images || [];
    const videoFile = files.video ? files.video[0] : undefined;

    // console.log('Received images:', images);

    return this.momentsService.createMoment({
      ...dto,
      userId,
      files: images,
      videoFile,
    });
  }

  // get all moments with infinite scroll
  @Get('all')
  async getMomentsInfinite(
    @Req() req: RequestWithUser,
    @Query('lastId') lastId?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req.user as any)?.userId;
    const limitNumber = parseInt(limit || '20');

    const cleanLastId = lastId === '' ? undefined : lastId;

    const result = await this.momentsService.getMomentsInfinite(
      cleanLastId,
      limitNumber,
      userId,
    );
    return result;
  }

  // get single moment by id
  @Get('details/:id')
  async getMomentById(@Param('id') id: string) {
    const result = await this.momentsService.getMomentById(id);
    return result;
  }

  // get user moments
  @Get('user/:userId')
  async getMomentsByUser(
    @Param('userId') userId: string,
    @Query('lastId') lastId?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = parseInt(limit || '10');

    const cleanLastId = lastId === '' ? undefined : lastId;

    const result = await this.momentsService.getMomentsByUser(
      userId,
      limitNumber,
      cleanLastId,
    );

    return result; // { data: [...], hasMore: true/false }
  }

  // update moment by owner
  // PATCH /moment/update/:id
  @Patch('update/:momentId')
  async updateMoment(
    @Param('momentId') momentId: string,
    @Body() dto: UpdateMomentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;
    const result = await this.momentsService.updateMoment(
      momentId,
      userId,
      dto,
    );
    return result;
  }

  // delete moment
  // DELETE /moment/:momentId
  @Delete('delete/:momentId')
  async deleteMoment(
    @Param('momentId') momentId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;

    return this.momentsService.deleteMoment(momentId, userId);
  }

  // like a moment
  @Post(':momentId/like')
  async likeMoment(
    @Param('momentId') momentId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;

    return this.momentsService.likeMoment(momentId, userId);
  }

  // POST /moment/:momentId/comment
  @Post(':momentId/add-comment')
  async addComment(
    @Param('momentId') momentId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: RequestWithUser,
  ) {
    // get current user id from JWT
    const userId = (req.user as any)?.userId;

    // forward to service - service expects validated content + server-derived userId + momentId
    return this.momentsService.addComment(momentId, userId, dto);
  }

  // PUT /moment/:commentId/update-comment
  @Put(':commentId/update-comment')
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateMomentCommentDto,
  ) {
    const result = await this.momentsService.updateComment(commentId, dto);

    return result;
  }

  // GET /moment/:momentId/all-comments
  @Get(':momentId/all-comments')
  async getCommentsInfinite(
    @Req() req: RequestWithUser,
    @Param('momentId') momentId: string,
    @Query('lastId') lastId?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req.user as any)?.userId;
    const limitNumber = parseInt(limit || '20');
    const cleanLastId = lastId === '' ? undefined : lastId;

    const result = await this.momentsService.getCommentsInfinite(
      momentId,
      cleanLastId,
      limitNumber,
      userId,
    );

    return result;
  }

  // DELETE /moment/:commentId/delete
  @Delete(':commentId/delete-comment')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;

    return this.momentsService.deleteComment(commentId, userId);
  }

  // POST /moment/comment/:commentId/like
  @Post('comment/:commentId/like')
  async toggleCommentLike(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ) {
    // get user id from JWT
    const userId = (req.user as any)?.userId;

    // call service to like/unlike
    return this.momentsService.toggleCommentLike(commentId, userId);
  }

  // POST /moment/comment/:commentId/reply
  @Post('comment/:commentId/reply')
  async addReply(
    @Param('commentId') commentId: string,
    @Body() dto: CreateCommentReplyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;
    return this.momentsService.addReply(commentId, userId, dto);
  }

  // PATCH /moment/reply/:replyId/update
  @Patch('reply/:replyId/update-reply')
  async updateReply(
    @Param('replyId') replyId: string,
    @Body() dto: UpdateCommentReplyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;

    return this.momentsService.updateReply(replyId, userId, dto);
  }

  // DELETE /moment/reply/:replyId/delete-reply
  @Delete('reply/:replyId/delete-reply')
  async deleteReply(
    @Param('replyId') replyId: string, // ID of the reply to delete
    @Req() req: RequestWithUser, // Get user from JWT
  ) {
    const userId = (req.user as any)?.userId; // Extract userId from JWT
    return this.momentsService.deleteReply(replyId, userId);
  }

  // GET /moment/comment/:commentId/all-replies
  @Get('comment/:commentId/all-replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query('lastId') lastId?: string,
    @Query('limit') limit = '10',
  ) {
    const limitNumber = parseInt(limit || '20');
    const cleanLastId = lastId === '' ? undefined : lastId;

    return this.momentsService.getRepliesInfinite(
      commentId,
      cleanLastId,
      limitNumber,
    );
  }
}
