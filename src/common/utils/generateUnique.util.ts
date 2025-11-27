import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateUniqueUserId(): Promise<string> {
  while (true) {
    const id = Math.floor(10000000 + Math.random() * 90000000).toString();

    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) return id.toString();
  }
}
