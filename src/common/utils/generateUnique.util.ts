import { PrismaClient } from '@prisma/client';

export async function generateUniqueUserId(
  prisma: PrismaClient,
): Promise<string> {
  while (true) {
    const id = Math.floor(10000000 + Math.random() * 90000000).toString();

    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) return id.toString();
  }
}
