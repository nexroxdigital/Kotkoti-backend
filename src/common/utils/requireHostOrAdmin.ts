import { ForbiddenException } from "@nestjs/common";

export function requireHostOrAdmin(participant: { role: string }) {
  if (participant.role !== 'HOST' && participant.role !== 'ADMIN') {
    throw new ForbiddenException('Insufficient permissions');
  }
}
