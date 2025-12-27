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


// async function generateUserNo(prisma: PrismaClient): Promise<string> {
//   const seq = await prisma.$transaction(async (tx) => {
//     const updated = await tx.userSequence.update({
//       where: { id: 1 },
//       data: { current: { increment: 1 } },
//     });
//     return updated.current;
//   });

//   return seq.toString().padStart(8, '0');
// }
