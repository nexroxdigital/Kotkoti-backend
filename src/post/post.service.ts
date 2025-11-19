import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  create(body: { title: string; content?: string }) {
    return this.prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
      },
    });
  }

  findAll() {
    return this.prisma.post.findMany();
  }

  delete(id: number) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
