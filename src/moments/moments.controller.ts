import {
  Body,
  Controller,
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
  constructor(private readonly momentService: MomentsService) {}

  @Post('create')
  async createMoment(
    @Body() dto: CreateMomentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any)?.userId;

    return this.momentService.createMoment({ ...dto, userId });
  }

  // get all moments with infinite scroll
  @Get('all')
  async getMomentsInfinite(
    @Query('lastId') lastId?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = parseInt(limit || '10');

    const result = await this.momentService.getMomentsInfinite(
      lastId,
      limitNumber,
    );
    return result;
  }

  // get single moment by id
  @Get('details/:id')
  async getMomentById(@Param('id') id: string) {
    const result = await this.momentService.getMomentById(id);
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

    const result = await this.momentService.getMomentsByUser(
      userId,
      limitNumber,
      lastId,
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
    const result = await this.momentService.updateMoment(momentId, userId, dto);
    return result;
  }
}
