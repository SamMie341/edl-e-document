import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class GetAuditLogByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const log = await this.prisma.auditLogModel.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            empCode: true,
            email: true,
            firstNameLa: true,
            lastNameLa: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        division: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`ບໍ່ພົບ Audit Log ທີ່ມີ ID: ${id}`);
    }

    return log;
  }

  async findByEntityId(entityId: string) {
    const logs = await this.prisma.auditLogModel.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            empCode: true,
            email: true,
            firstNameLa: true,
            lastNameLa: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        division: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return logs;
  }
}
