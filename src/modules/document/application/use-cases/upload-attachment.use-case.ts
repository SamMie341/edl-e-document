import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { PrismaService } from 'src/core/database/prisma.service';
import { AppException } from 'src/core/exceptions/app.exception';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';
import { AuditService } from 'src/modules/audit/application/services/audit.service';

@Injectable()
export class UploadAttachmentUseCase {
  constructor(
    @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
    private readonly fileStorage: fileStorageInterface.IFileStorageService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async execute(documentId: string, file: any, userId: string): Promise<any> {
    const document = await this.prisma.documentModel.findUnique({
      where: { id: documentId },
    });
    if (!document)
      throw new AppException(
        'NOT_FOUND',
        'ບໍ່ພົບເອກະສານ',
        { documentId },
        HttpStatus.NOT_FOUND,
      );
    if (document.userId !== userId)
      throw new AppException(
        'FORBIDDEN',
        'ສະເພາະເຈົ້າຂອງເອກະສານເທົ່ານັ້ນທີ່ເພີ່ມໄຟລ໌ໄດ້',
        '',
        HttpStatus.FORBIDDEN,
      );

    const savedFile = await this.fileStorage.uploadAndCompress(file);

    const attachment = await this.prisma.attachmentModel.create({
      data: {
        fileName: savedFile.fileName,
        filePath: savedFile.filePath,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        documentId: document.id,
      },
    });

    await this.auditService.log({
      action: AuditAction.UPLOADATTACHMENT,
      details: `ອັບໂຫຼດໄຟລ໌ແນບ: ${savedFile.fileName}`,
      entityId: document.id,
      entityType: 'DOCUMENT',
      actorId: userId,
      departmentId: document.departmentId,
      divisionId: document.divisionId,
      payload: { attachmentId: attachment.id, fileName: savedFile.fileName },
    });

    return attachment;
  }
}
