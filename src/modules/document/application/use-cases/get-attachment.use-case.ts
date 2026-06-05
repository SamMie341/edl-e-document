import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';
import * as fs from 'fs';
import { AuditLog } from 'src/modules/audit/domain/entities/audit-log.entity';
import * as auditLogRepositoryInterface from 'src/modules/audit/domain/repositories/audit-log.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { AppException } from 'src/core/exceptions/app.exception';

@Injectable()
export class GetAttachmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
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

    if (user.role === Role.USER && doc.userId !== user.userId) {
      throw new AppException(
        'UNAUTHORIZATION',
        'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໄຟລ໌ຂອງເອກະສານສະບັບນີ້',
        '',
        HttpStatus.UNAUTHORIZED,
      );
    }
    // if (user.role === Role.BRANCH_ADMIN && doc.branchId !== user.branchId) {
    //     throw new AppException('UNAUTHORIZATION', 'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໄຟລ໌ສາຂາອື່ນ', '', HttpStatus.UNAUTHORIZED);
    // }

    if (!fs.existsSync(attachment.filePath)) {
      throw new AppException(
        'NOT_FOUND',
        'ໄຟລ໌ສຸູນຫາຍ ຫຼື ຖືກລຶບອອກຈາກລະບົບແລ້ວ',
        `${attachment.filePath}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // const log = new AuditLog(
    //   uuidv4(),
    //   AuditAction.GET,
    //   '',
    //   doc.id,
    //   'DOCUMENT',
    //   user.userId,
    //   new Date(),
    // );

    // await this.auditLogRepository.save(log);

    return attachment;
  }
}
