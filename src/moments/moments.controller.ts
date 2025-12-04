import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateMomentDto, UpdateMomentDto } from './dto/moment.dto';
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
  async createMoment(
    @Body() dto: CreateMomentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;

    return this.momentsService.createMoment({ ...dto, userId });
  }

  // get all moments with infinite scroll
  @Get('all')
  async getMomentsInfinite(
    @Query('lastId') lastId?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = parseInt(limit || '10');

    console.log('lastid', lastId);

    const cleanLastId = lastId === '' ? undefined : lastId;

    console.log('clentlastId', cleanLastId);

    const result = await this.momentsService.getMomentsInfinite(
      cleanLastId,
      limitNumber,
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
}
