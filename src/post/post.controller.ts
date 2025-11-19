import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  create(@Body() body: { title: string; content?: string }) {
    return this.postService.create(body);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.postService.delete(Number(id));
  }
}
