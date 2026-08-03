import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';
import * as fs from 'fs';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { AppException } from 'src/core/exceptions/app.exception';
import { AuditService } from 'src/modules/audit/application/services/audit.service';

@Injectable()
export class GetAttachmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async execute(attachmentId: string, user: any) {
    const attachment = await this.prisma.attachmentModel.findUnique({
      where: { id: attachmentId },
      include: { document: true },
    });

    if (!attachment) {
      throw new AppException(
        'ATTACHMENT_NOT_FOUND',
        'ບໍ່ພົບໄຟລ໌ແນບໃນລະບົບ',
        '',
        HttpStatus.NOT_FOUND,
      );
    }

    const doc = attachment.document;

    if (user.role === Role.USER) {
      // USER เห็นเฉพาะ attachment ใน primary division ของตัวเอง หรือ เอกสารที่ตัวเองอัพโหลด
      const primaryDiv = await this.prisma.userDivisionModel.findFirst({
        where: { userId: user.userId, isPrimary: true },
        select: { divisionId: true },
      });
      const isOwner = doc.userId === user.userId;
      const isSameDivision = primaryDiv && doc.divisionId === primaryDiv.divisionId;
      if (!isOwner && !isSameDivision) {
        throw new AppException(
          'UNAUTHORIZATION',
          'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໄຟລ່ຂອງເອກະສານສະບັບນີ້',
          '',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } else if (user.role === Role.BRANCH_ADMIN) {
      // BRANCH_ADMIN เห็นเฉพาะ attachment ใน divisions ที่ถูก assign
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      const allowedDivisionIds = userDivs.map((ud) => ud.divisionId);

      if (!doc.divisionId || !allowedDivisionIds.includes(doc.divisionId)) {
        throw new AppException(
          'UNAUTHORIZATION',
          'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໄຟລ່ຂອງເອກະສານສະບັບນີ້',
          '',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    if (!fs.existsSync(attachment.filePath)) {
      throw new AppException(
        'NOT_FOUND',
        'ໄຟລ໌ສຸູນຫາຍ ຫຼື ຖືກລຶບອອກຈາກລະບົບແລ້ວ',
        `${attachment.filePath}`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.auditService.log({
      action: AuditAction.GET,
      details: `ດາວໂຫຼດ/ເບິ່ງໄຟລ໌ແນບ: ${attachment.fileName}`,
      entityId: attachment.id,
      entityType: 'ATTACHMENT',
      actorId: user.userId || user.id,
      departmentId: user.departmentId || doc.departmentId,
      divisionId: user.divisionId || doc.divisionId,
    });

    return attachment;
  }
}
